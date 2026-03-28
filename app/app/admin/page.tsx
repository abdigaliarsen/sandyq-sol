"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Users,
  DollarSign,
  AlertTriangle,
  Loader2,
  UserPlus,
  ShieldCheck,
  ShieldX,
  Coins,
  Lock,
  Unlock,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrency,
  formatNumber,
  truncateAddress,
  COMPLIANCE_HOOK_PROGRAM_ID,
  RWA_CORE_PROGRAM_ID,
} from "@/lib/constants";
import {
  getRwaCoreProgram,
  getComplianceHookProgram,
  getAssetConfigPda,
  getInvestorRecordPda,
  getFreezeAuthorityPda,
  getMintAuthorityPda,
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

interface AssetInfo {
  mint: string;
  name: string;
  symbol: string;
  authority: string;
  totalSupply: number;
  maxSupply: number;
  valuationUsd: number;
}

interface InvestorInfo {
  wallet: string;
  isKyc: boolean;
  isAuthority: boolean;
  createdAt: number;
  recordPda: string;
}

export default function AdminPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;

  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);
  const [investors, setInvestors] = useState<InvestorInfo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [registerWallet, setRegisterWallet] = useState("");
  const [issueWallet, setIssueWallet] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [forceFromWallet, setForceFromWallet] = useState("");
  const [forceToWallet, setForceToWallet] = useState("");
  const [forceAmount, setForceAmount] = useState("");

  useEffect(() => {
    if (publicKey) loadAdmin();
    else setLoading(false);
  }, [publicKey, connection]);

  async function loadAdmin() {
    if (!publicKey) return;
    setLoading(true);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const complianceProgram = getComplianceHookProgram(provider);

      const allAssets = await (
        program.account as any
      ).assetConfig.all();

      const parsed: AssetInfo[] = allAssets
        .filter(
          (acc: any) =>
            acc.account.authority.toBase58() === publicKey.toBase58()
        )
        .map((acc: any) => ({
          mint: acc.account.mint.toBase58(),
          name: acc.account.name,
          symbol: acc.account.symbol,
          authority: acc.account.authority.toBase58(),
          totalSupply: acc.account.totalSupply.toNumber(),
          maxSupply: acc.account.maxSupply.toNumber(),
          valuationUsd: acc.account.valuationUsd.toNumber(),
        }));

      setAssets(parsed);
      setIsAdmin(parsed.length > 0);
      if (parsed.length > 0) {
        setSelectedAsset(parsed[0]);
        await loadInvestors(
          parsed[0].mint,
          complianceProgram
        );
      }
    } catch (e) {
      console.error("Admin load error:", e);
      setAssets([]);
      setIsAdmin(false);
    }
    setLoading(false);
  }

  async function loadInvestors(mint: string, complianceProgram: any) {
    try {
      const mintPk = new PublicKey(mint);
      const allRecords = await complianceProgram.account.investorRecord.all([
        { memcmp: { offset: 8 + 32, bytes: mintPk.toBase58() } },
      ]);
      const parsed: InvestorInfo[] = allRecords.map((acc: any) => ({
        wallet: acc.account.wallet.toBase58(),
        isKyc: acc.account.isKyc,
        isAuthority: acc.account.isAuthority,
        createdAt: acc.account.createdAt.toNumber(),
        recordPda: acc.publicKey.toBase58(),
      }));
      setInvestors(parsed);
    } catch {
      setInvestors([]);
    }
  }

  async function handleRegisterInvestor() {
    if (!publicKey || !selectedAsset || !registerWallet) return;
    setActionLoading("register");
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);
      const investorWallet = new PublicKey(registerWallet);
      const [investorPda] = getInvestorRecordPda(mint, investorWallet);

      const tx = await (program.methods as any)
        .registerInvestor()
        .accounts({
          authority: publicKey,
          mint,
          wallet: investorWallet,
          investorRecord: investorPda,
          complianceHookProgram: COMPLIANCE_HOOK_PROGRAM_ID,
        })
        .rpc();

      toast.success("Investor registered!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      setRegisterWallet("");
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  async function handleApproveKyc(investorWalletStr: string) {
    if (!publicKey || !selectedAsset) return;
    setActionLoading(`approve-${investorWalletStr}`);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);
      const investorWallet = new PublicKey(investorWalletStr);
      const [investorPda] = getInvestorRecordPda(mint, investorWallet);
      const investorAta = getAssociatedTokenAddressSync(
        mint,
        investorWallet,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const [freezeAuth] = getFreezeAuthorityPda(mint);

      const tx = await (program.methods as any)
        .approveKyc()
        .accounts({
          authority: publicKey,
          mint,
          investorRecord: investorPda,
          investorTokenAccount: investorAta,
          freezeAuthority: freezeAuth,
          complianceHookProgram: COMPLIANCE_HOOK_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      toast.success("KYC approved!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  async function handleRevokeKyc(investorWalletStr: string) {
    if (!publicKey || !selectedAsset) return;
    setActionLoading(`revoke-${investorWalletStr}`);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);
      const investorWallet = new PublicKey(investorWalletStr);
      const [investorPda] = getInvestorRecordPda(mint, investorWallet);
      const investorAta = getAssociatedTokenAddressSync(
        mint,
        investorWallet,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const [freezeAuth] = getFreezeAuthorityPda(mint);

      const tx = await (program.methods as any)
        .revokeKyc()
        .accounts({
          authority: publicKey,
          mint,
          investorRecord: investorPda,
          investorTokenAccount: investorAta,
          freezeAuthority: freezeAuth,
          complianceHookProgram: COMPLIANCE_HOOK_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      toast.success("KYC revoked!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  async function handleIssueTokens() {
    if (!publicKey || !selectedAsset || !issueWallet || !issueAmount)
      return;
    setActionLoading("issue");
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);
      const investorWallet = new PublicKey(issueWallet);
      const [investorPda] = getInvestorRecordPda(mint, investorWallet);
      const destAta = getAssociatedTokenAddressSync(
        mint,
        investorWallet,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const [mintAuth] = getMintAuthorityPda(mint);

      const tx = await (program.methods as any)
        .issueTokens(new BN(issueAmount))
        .accounts({
          authority: publicKey,
          mint,
          investorRecord: investorPda,
          destination: destAta,
          mintAuthority: mintAuth,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      toast.success("Tokens issued!", {
        description: `${issueAmount} ${selectedAsset.symbol} issued. TX: ${truncateAddress(tx, 8)}`,
      });
      setIssueWallet("");
      setIssueAmount("");
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  async function handleDepositYield() {
    if (!publicKey || !selectedAsset || !yieldAmount) return;
    setActionLoading("yield");
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);

      const tx = await (program.methods as any)
        .depositYield(new BN(yieldAmount))
        .accounts({
          rwaMint: mint,
        })
        .rpc();

      toast.success("Yield deposited!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      setYieldAmount("");
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  async function handleForceTransfer() {
    if (
      !publicKey ||
      !selectedAsset ||
      !forceFromWallet ||
      !forceToWallet ||
      !forceAmount
    )
      return;
    setActionLoading("force");
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);
      const from = new PublicKey(forceFromWallet);
      const to = new PublicKey(forceToWallet);
      const sourceAta = getAssociatedTokenAddressSync(
        mint,
        from,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const destAta = getAssociatedTokenAddressSync(
        mint,
        to,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const [permDelegate] = getMintAuthorityPda(mint);
      const [freezeAuth] = getFreezeAuthorityPda(mint);
      const [extraMeta] = getExtraAccountMetaListPda(mint);
      const [senderRecord] = getInvestorRecordPda(mint, from);
      const [receiverRecord] = getInvestorRecordPda(mint, to);

      const tx = await (program.methods as any)
        .forceTransfer(new BN(forceAmount))
        .accounts({
          authority: publicKey,
          mint,
          source: sourceAta,
          destination: destAta,
          permanentDelegate: permDelegate,
          freezeAuthority: freezeAuth,
          extraAccountMetaList: extraMeta,
          senderInvestorRecord: senderRecord,
          receiverInvestorRecord: receiverRecord,
          complianceHookProgram: COMPLIANCE_HOOK_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      toast.success("Force transfer complete!", {
        description: `TX: ${truncateAddress(tx, 8)}`,
      });
      setForceFromWallet("");
      setForceToWallet("");
      setForceAmount("");
      loadAdmin();
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
  }

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Shield className="h-12 w-12 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#F1F5F9]">
          Admin Access Required
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Connect the asset authority wallet to access admin features
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[#1E293B] rounded animate-pulse" />
        <div className="h-96 bg-[#111827] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h2 className="text-xl font-semibold text-[#F1F5F9]">
          Not Authorized
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Your wallet is not the authority for any asset. Connect the correct wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Admin Panel</h1>
        {selectedAsset && (
          <Badge variant="outline" className="border-gold/30 text-gold">
            {selectedAsset.symbol} - {truncateAddress(selectedAsset.mint)}
          </Badge>
        )}
      </div>

      {/* Asset selector if multiple */}
      {assets.length > 1 && (
        <div className="flex gap-2">
          {assets.map((a) => (
            <Button
              key={a.mint}
              variant={
                selectedAsset?.mint === a.mint ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedAsset(a)}
              className={
                selectedAsset?.mint === a.mint
                  ? "bg-gold text-[#0B0E14]"
                  : "border-border text-[#94A3B8]"
              }
            >
              {a.symbol}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="investors" className="space-y-4">
        <TabsList className="bg-[#111827] border border-border">
          <TabsTrigger
            value="investors"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <Users className="h-3 w-3 mr-1" /> Investors
          </TabsTrigger>
          <TabsTrigger
            value="distributions"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <DollarSign className="h-3 w-3 mr-1" /> Distributions
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <Shield className="h-3 w-3 mr-1" /> Compliance
          </TabsTrigger>
        </TabsList>

        {/* INVESTORS TAB */}
        <TabsContent value="investors" className="space-y-4">
          {/* Register new investor */}
          <Card className="bg-[#111827] border-border">
            <CardHeader>
              <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-gold" />
                Register & Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-[#94A3B8]">
                    Investor Wallet
                  </Label>
                  <Input
                    placeholder="Wallet address to register"
                    value={registerWallet}
                    onChange={(e) => setRegisterWallet(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleRegisterInvestor}
                    disabled={
                      actionLoading === "register" || !registerWallet
                    }
                    className="w-full bg-gold text-[#0B0E14] hover:bg-gold-dark"
                  >
                    {actionLoading === "register" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3 mr-1" />
                    )}
                    Register
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-[#94A3B8]">
                    Issue To (wallet)
                  </Label>
                  <Input
                    placeholder="Wallet address"
                    value={issueWallet}
                    onChange={(e) => setIssueWallet(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#94A3B8]">
                    Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={issueAmount}
                    onChange={(e) => setIssueAmount(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleIssueTokens}
                    disabled={
                      actionLoading === "issue" ||
                      !issueWallet ||
                      !issueAmount
                    }
                    className="w-full bg-gold text-[#0B0E14] hover:bg-gold-dark"
                  >
                    {actionLoading === "issue" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Coins className="h-3 w-3 mr-1" />
                    )}
                    Issue Tokens
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investors table */}
          <Card className="bg-[#111827] border-border">
            <CardHeader>
              <CardTitle className="text-base text-[#F1F5F9]">
                Registered Investors ({investors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investors.length === 0 ? (
                <p className="text-sm text-[#94A3B8] py-4 text-center">
                  No investors registered yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[#94A3B8] text-xs">
                        Wallet
                      </TableHead>
                      <TableHead className="text-[#94A3B8] text-xs">
                        KYC Status
                      </TableHead>
                      <TableHead className="text-[#94A3B8] text-xs">
                        Role
                      </TableHead>
                      <TableHead className="text-[#94A3B8] text-xs">
                        Registered
                      </TableHead>
                      <TableHead className="text-[#94A3B8] text-xs text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investors.map((inv) => (
                      <TableRow
                        key={inv.recordPda}
                        className="border-border hover:bg-[#1E293B]"
                      >
                        <TableCell className="font-mono text-xs text-[#F1F5F9]">
                          {truncateAddress(inv.wallet, 6)}
                        </TableCell>
                        <TableCell>
                          {inv.isKyc ? (
                            <Badge className="bg-success/10 text-success border-0 text-xs">
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/10 text-warning border-0 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-[#94A3B8]">
                          {inv.isAuthority ? "Authority" : "Investor"}
                        </TableCell>
                        <TableCell className="text-xs text-[#94A3B8]">
                          {new Date(
                            inv.createdAt * 1000
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {!inv.isKyc ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleApproveKyc(inv.wallet)
                              }
                              disabled={
                                actionLoading ===
                                `approve-${inv.wallet}`
                              }
                              className="border-success/30 text-success hover:bg-success/10 text-xs h-7"
                            >
                              {actionLoading ===
                              `approve-${inv.wallet}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRevokeKyc(inv.wallet)
                              }
                              disabled={
                                actionLoading ===
                                `revoke-${inv.wallet}`
                              }
                              className="border-danger/30 text-danger hover:bg-danger/10 text-xs h-7"
                            >
                              {actionLoading ===
                              `revoke-${inv.wallet}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShieldX className="h-3 w-3 mr-1" />
                              )}
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISTRIBUTIONS TAB */}
        <TabsContent value="distributions" className="space-y-4">
          <Card className="bg-[#111827] border-border">
            <CardHeader>
              <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold" />
                Deposit Yield
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-[#94A3B8]">
                    Amount (USDC lamports)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Amount in smallest units"
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                  {yieldAmount &&
                    selectedAsset &&
                    selectedAsset.totalSupply > 0 && (
                      <p className="text-xs text-[#475569]">
                        Per-token yield:{" "}
                        {(
                          Number(yieldAmount) /
                          selectedAsset.totalSupply
                        ).toFixed(2)}{" "}
                        lamports/token
                      </p>
                    )}
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleDepositYield}
                    disabled={
                      actionLoading === "yield" || !yieldAmount
                    }
                    className="w-full bg-gold text-[#0B0E14] hover:bg-gold-dark"
                  >
                    {actionLoading === "yield" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <DollarSign className="h-3 w-3 mr-1" />
                    )}
                    Deposit Yield
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset stats */}
          {selectedAsset && (
            <Card className="bg-[#111827] border-border">
              <CardHeader>
                <CardTitle className="text-base text-[#F1F5F9]">
                  Asset Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[#94A3B8]">Total Supply</p>
                    <p className="text-lg font-mono text-[#F1F5F9]">
                      {formatNumber(selectedAsset.totalSupply)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Max Supply</p>
                    <p className="text-lg font-mono text-[#F1F5F9]">
                      {formatNumber(selectedAsset.maxSupply)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Valuation</p>
                    <p className="text-lg font-mono text-[#F1F5F9]">
                      {formatCurrency(selectedAsset.valuationUsd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Investors</p>
                    <p className="text-lg font-mono text-[#F1F5F9]">
                      {investors.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance" className="space-y-4">
          {/* Force Transfer */}
          <Card className="bg-[#111827] border-border border-danger/20">
            <CardHeader>
              <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-danger" />
                Force Transfer (Recall)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#475569]">
                Use this to recall tokens from an investor back to
                treasury. Requires permanent delegate authority.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#94A3B8]">
                    From (wallet)
                  </Label>
                  <Input
                    placeholder="Source wallet"
                    value={forceFromWallet}
                    onChange={(e) =>
                      setForceFromWallet(e.target.value)
                    }
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#94A3B8]">
                    To (wallet)
                  </Label>
                  <Input
                    placeholder="Destination wallet"
                    value={forceToWallet}
                    onChange={(e) => setForceToWallet(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#94A3B8]">
                    Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={forceAmount}
                    onChange={(e) => setForceAmount(e.target.value)}
                    className="bg-[#0B0E14] border-border text-[#F1F5F9] font-mono text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={handleForceTransfer}
                disabled={
                  actionLoading === "force" ||
                  !forceFromWallet ||
                  !forceToWallet ||
                  !forceAmount
                }
                variant="outline"
                className="border-danger/30 text-danger hover:bg-danger/10"
              >
                {actionLoading === "force" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                )}
                Execute Force Transfer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
