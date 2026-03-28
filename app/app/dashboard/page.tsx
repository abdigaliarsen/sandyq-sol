"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
  addExtraAccountMetasForExecute,
} from "@solana/spl-token";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Wallet,
  TrendingUp,
  DollarSign,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency,
  formatNumber,
  truncateAddress,
  COMPLIANCE_HOOK_PROGRAM_ID,
} from "@/lib/constants";
import {
  getRwaCoreProgram,
  getComplianceHookProgram,
  getAssetConfigPda,
  getInvestorRecordPda,
  getInvestorYieldPda,
  getYieldVaultPda,
  getExtraAccountMetaListPda,
  parseAnchorError,
} from "@/lib/programs";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

interface HoldingInfo {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  valuationUsd: number;
  pricePerToken: number;
}

export default function DashboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;

  const [kycStatus, setKycStatus] = useState<
    "verified" | "pending" | "not_registered" | null
  >(null);
  const [holdings, setHoldings] = useState<HoldingInfo[]>([]);
  const [unclaimedYield, setUnclaimedYield] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [transferring, setTransferring] = useState(false);

  // Transfer form
  const [transferMint, setTransferMint] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  useEffect(() => {
    if (publicKey) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [publicKey, connection]);

  async function loadDashboard() {
    if (!publicKey) return;
    setLoading(true);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const rwaCoreProgram = getRwaCoreProgram(provider);
      const complianceProgram = getComplianceHookProgram(provider);

      // get all assets
      const allAssets = await (
        rwaCoreProgram.account as any
      ).assetConfig.all();

      // check KYC for first asset
      if (allAssets.length > 0) {
        const firstMint = allAssets[0].account.mint;
        const [investorPda] = getInvestorRecordPda(firstMint, publicKey);
        try {
          const record = await (
            complianceProgram.account as any
          ).investorRecord.fetch(investorPda);
          setKycStatus(record.isKyc ? "verified" : "pending");
        } catch {
          setKycStatus("not_registered");
        }
      } else {
        setKycStatus("not_registered");
      }

      // check holdings & yield for each asset
      const holdingsArr: HoldingInfo[] = [];
      let totalUnclaimed = 0;
      let totalEarnedVal = 0;

      for (const acc of allAssets) {
        const config = acc.account;
        const mint = config.mint;
        const pricePerToken =
          config.maxSupply.toNumber() > 0
            ? config.valuationUsd.toNumber() / config.maxSupply.toNumber()
            : 0;

        try {
          const ata = getAssociatedTokenAddressSync(
            mint,
            publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          const tokenAcc = await connection.getTokenAccountBalance(ata);
          const balance = Number(tokenAcc.value.amount);
          if (balance > 0) {
            holdingsArr.push({
              mint: mint.toBase58(),
              name: config.name,
              symbol: config.symbol,
              balance,
              valuationUsd: balance * pricePerToken,
              pricePerToken,
            });
            if (!transferMint) setTransferMint(mint.toBase58());
          }
        } catch {
          // no token account
        }

        // check yield
        try {
          const [yieldPda] = getInvestorYieldPda(mint, publicKey);
          const yieldData = await (
            rwaCoreProgram.account as any
          ).investorYield.fetch(yieldPda);
          totalUnclaimed += yieldData.rewardsEarned.toNumber();
        } catch {
          // no yield account
        }
      }

      setHoldings(holdingsArr);
      setUnclaimedYield(totalUnclaimed);
      setTotalEarned(totalEarnedVal);
    } catch (e) {
      console.error("Dashboard load error:", e);
      setKycStatus("not_registered");
      setHoldings([]);
      setUnclaimedYield(0);
    }
    setLoading(false);
  }

  async function handleClaimYield() {
    if (!publicKey || !sendTransaction || holdings.length === 0) return;
    setClaiming(true);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(holdings[0].mint);

      const tx = await (program.methods as any)
        .claimYield()
        .accounts({
          rwaMint: mint,
        })
        .rpc();

      toast.success("Yield claimed successfully!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      loadDashboard();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setClaiming(false);
  }

  async function handleTransfer() {
    if (
      !publicKey ||
      !sendTransaction ||
      !transferRecipient ||
      !transferAmount ||
      !transferMint
    )
      return;
    setTransferring(true);
    try {
      const mint = new PublicKey(transferMint);
      const recipient = new PublicKey(transferRecipient);
      const amount = Number(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Invalid amount");
        setTransferring(false);
        return;
      }

      const sourceAta = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const destAta = getAssociatedTokenAddressSync(
        mint,
        recipient,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = new Transaction();

      // request 300K compute units for hook
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })
      );

      const transferIx = createTransferCheckedInstruction(
        sourceAta,
        mint,
        destAta,
        publicKey,
        amount,
        0, // decimals
        [],
        TOKEN_2022_PROGRAM_ID
      );

      // add extra account metas for the transfer hook
      await addExtraAccountMetasForExecute(
        connection,
        transferIx,
        COMPLIANCE_HOOK_PROGRAM_ID,
        sourceAta,
        mint,
        destAta,
        publicKey,
        amount,
        "confirmed"
      );

      tx.add(transferIx);

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      toast.success("Transfer successful!", {
        description: `TX: ${truncateAddress(sig, 8)}`,
      });
      setTransferRecipient("");
      setTransferAmount("");
      loadDashboard();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setTransferring(false);
  }

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Wallet className="h-12 w-12 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#F1F5F9]">
          Connect Your Wallet
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Connect a Solana wallet to view your dashboard
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-[#111827] rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#111827] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalHoldingsValue = holdings.reduce(
    (s, h) => s + h.valuationUsd,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#F1F5F9]">
        Investor Dashboard
      </h1>

      {/* KYC Banner */}
      {kycStatus === "verified" && (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-success">
              KYC Verified
            </p>
            <p className="text-xs text-[#94A3B8]">
              You are approved to trade and receive yield distributions
            </p>
          </div>
        </div>
      )}
      {kycStatus === "pending" && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
          <ShieldAlert className="h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">
              KYC Pending
            </p>
            <p className="text-xs text-[#94A3B8]">
              Your account is registered but KYC is not yet approved.
              Contact the asset administrator.
            </p>
          </div>
        </div>
      )}
      {kycStatus === "not_registered" && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/5 p-4">
          <ShieldX className="h-5 w-5 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">
              Not Registered
            </p>
            <p className="text-xs text-[#94A3B8]">
              Your wallet is not registered as an investor. Ask the asset
              administrator to register you.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">My Holdings</p>
              <p className="text-xl font-semibold text-[#F1F5F9]">
                {formatCurrency(totalHoldingsValue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Unclaimed Yield</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(unclaimedYield / 1_000_000)}{" "}
                <span className="text-xs text-[#94A3B8]">USDC</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Total Earned</p>
              <p className="text-xl font-semibold text-[#F1F5F9]">
                {formatCurrency(totalEarned / 1_000_000)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="bg-[#111827] border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-[#F1F5F9]">
            Holdings
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClaimYield}
            disabled={claiming || unclaimedYield === 0}
            className="border-success/30 text-success hover:bg-success/10 hover:text-success"
          >
            {claiming ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            Claim Yield
          </Button>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <p className="text-sm text-[#94A3B8] py-4 text-center">
              You don&apos;t hold any RWA tokens yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[#94A3B8] text-xs">
                    Asset
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs">
                    Symbol
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs text-right">
                    Tokens
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs text-right">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => (
                  <TableRow
                    key={h.mint}
                    className="border-border hover:bg-[#1E293B]"
                  >
                    <TableCell className="text-sm text-[#F1F5F9]">
                      {h.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-gold/30 text-gold text-xs"
                      >
                        {h.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#F1F5F9]">
                      {formatNumber(h.balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#F1F5F9]">
                      {formatCurrency(h.valuationUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transfer Form */}
      <Card className="bg-[#111827] border-border">
        <CardHeader>
          <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
            <Send className="h-4 w-4 text-gold" />
            Transfer Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#94A3B8]">
                Recipient Address
              </Label>
              <Input
                placeholder="Enter Solana wallet address"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#94A3B8]">
                Amount (tokens)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#475569]">
              Transfers require both sender and recipient to be KYC verified
            </p>
            <Button
              onClick={handleTransfer}
              disabled={
                transferring ||
                !transferRecipient ||
                !transferAmount ||
                kycStatus !== "verified"
              }
              className="bg-gold text-[#0B0E14] hover:bg-gold-dark"
            >
              {transferring ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Send Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
