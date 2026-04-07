"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  addExtraAccountMetasForExecute,
  getAccount,
} from "@solana/spl-token";
import Link from "next/link";
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
import { useTranslation } from "@/lib/i18n";
import {
  formatCurrency,
  formatNumber,
  truncateAddress,
  COMPLIANCE_HOOK_PROGRAM_ID,
} from "@/lib/constants";
import {
  getRwaCoreProgram,
  getComplianceHookProgram,
  getInvestorRecordPda,
  getInvestorYieldPda,
  getYieldVaultPda,
  getExtraAccountMetaListPda,
  parseAnchorError,
  getAssetConfigPda,
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
  const { t } = useTranslation();

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

  // All available assets
  const [allAssets, setAllAssets] = useState<Array<{
    mint: string; name: string; symbol: string; valuationUsd: number;
    maxSupply: number; totalSupply: number; isActive: boolean;
  }>>([]);

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

      // save all assets for browse section
      setAllAssets(allAssets.map((acc: any) => ({
        mint: acc.account.mint.toBase58(),
        name: acc.account.name,
        symbol: acc.account.symbol,
        valuationUsd: acc.account.valuationUsd.toNumber(),
        maxSupply: acc.account.maxSupply.toNumber(),
        totalSupply: acc.account.totalSupply.toNumber(),
        isActive: acc.account.isActive,
      })));

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
            ? config.valuationUsd.toNumber() / 100 / config.maxSupply.toNumber()
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

        // check yield: calculate from YieldVault + InvestorYield
        try {
          const [vaultPda] = getYieldVaultPda(mint);
          const vaultData = await (
            rwaCoreProgram.account as any
          ).yieldVault.fetch(vaultPda);

          const rewardPerTokenStored = vaultData.rewardPerTokenStored as BN;
          let rewardPerTokenPaid = new BN(0);
          let storedRewards = 0;

          try {
            const [yieldPda] = getInvestorYieldPda(mint, publicKey);
            const yieldData = await (
              rwaCoreProgram.account as any
            ).investorYield.fetch(yieldPda);
            rewardPerTokenPaid = yieldData.rewardPerTokenPaid as BN;
            storedRewards = yieldData.rewardsEarned.toNumber();
          } catch {
            // InvestorYield PDA doesn't exist yet — first-time claimer
          }

          // Find investor's balance for this asset
          const holding = holdingsArr.find((h) => h.mint === mint.toBase58());
          const balance = holding ? holding.balance : 0;

          // pending = balance * (rewardPerTokenStored - rewardPerTokenPaid) / PRECISION
          const PRECISION = new BN("1000000000000000000"); // 1e18 — must match on-chain
          const diff = rewardPerTokenStored.sub(rewardPerTokenPaid);
          const pending = new BN(balance).mul(diff).div(PRECISION).toNumber();
          const unclaimed = pending + storedRewards;

          totalUnclaimed += unclaimed;
          totalEarnedVal += unclaimed;
        } catch {
          // no yield vault for this asset
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

      for (const holding of holdings) {
        const rwaMint = new PublicKey(holding.mint);

        // Read YieldVault account to discover the reward mint
        const [yieldVaultPda] = getYieldVaultPda(rwaMint);
        let vaultData: any;
        try {
          vaultData = await (program.account as any).yieldVault.fetch(yieldVaultPda);
        } catch {
          // No yield vault for this asset, skip
          continue;
        }

        // The YieldVault doesn't store rewardMint directly in the IDL struct,
        // but the vault's reward ATA tells us which mint. We need to find the
        // reward mint. Since the test uses TOKEN_2022_PROGRAM_ID for reward,
        // we read the vault reward token account to discover the mint.
        // Actually, looking at the IDL, YieldVault has: mint, authority, reward_per_token_stored, total_deposited, last_update_time, bump.
        // The reward mint is passed as an account to depositYield/claimYield.
        // We need to find it by looking at token accounts owned by the yieldVaultPda.
        const vaultTokenAccounts = await connection.getTokenAccountsByOwner(
          yieldVaultPda,
          { programId: TOKEN_2022_PROGRAM_ID }
        );

        if (vaultTokenAccounts.value.length === 0) {
          // Try regular SPL token program
          const vaultTokenAccountsSpl = await connection.getTokenAccountsByOwner(
            yieldVaultPda,
            { programId: TOKEN_PROGRAM_ID }
          );
          if (vaultTokenAccountsSpl.value.length === 0) continue;
        }

        // Parse the first token account to get the reward mint
        // Token account layout: mint is at offset 0, 32 bytes
        const tokenAccData = vaultTokenAccounts.value.length > 0
          ? vaultTokenAccounts.value[0].account.data
          : (await connection.getTokenAccountsByOwner(yieldVaultPda, { programId: TOKEN_PROGRAM_ID })).value[0].account.data;
        const rewardMint = new PublicKey(tokenAccData.slice(0, 32));

        // Determine which token program the reward mint uses
        const rewardMintInfo = await connection.getAccountInfo(rewardMint);
        const rewardTokenProgram = rewardMintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID;

        // Derive ATAs
        const investorRwaAccount = getAssociatedTokenAddressSync(
          rwaMint,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const investorRewardAccount = getAssociatedTokenAddressSync(
          rewardMint,
          publicKey,
          false,
          rewardTokenProgram
        );
        const vaultRewardAccount = getAssociatedTokenAddressSync(
          rewardMint,
          yieldVaultPda,
          true,
          rewardTokenProgram
        );

        // Ensure investor reward ATA exists
        try {
          await getAccount(connection, investorRewardAccount, "confirmed", rewardTokenProgram);
        } catch {
          // Create the investor reward ATA first
          const createAtaTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              investorRewardAccount,
              publicKey,
              rewardMint,
              rewardTokenProgram
            )
          );
          const ataSig = await sendTransaction(createAtaTx, connection);
          await connection.confirmTransaction(ataSig, "confirmed");
        }

        const tx = await (program.methods as any)
          .claimYield()
          .accounts({
            investor: publicKey,
            rwaMint,
            rewardMint,
            investorRwaAccount,
            investorRewardAccount,
            vaultRewardAccount,
            tokenProgram: rewardTokenProgram,
          })
          .rpc();

        toast.success(t("dashboard.toast.yieldClaimed"), {
          description: `TX: ${truncateAddress(tx, 8)}`,
        });
      }

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
        toast.error(t("dashboard.toast.invalidAmount"));
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

      // Check if recipient ATA exists, create if not
      try {
        await getAccount(connection, destAta, "confirmed", TOKEN_2022_PROGRAM_ID);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            destAta,
            recipient,
            mint,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

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

      toast.success(t("dashboard.toast.transferSuccess"), {
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
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          {t("dashboard.connectWallet")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.connectWalletDesc")}
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-card rounded-xl animate-pulse"
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
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.title")}
      </h1>

      {/* KYC Banner */}
      {kycStatus === "verified" && (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-success">
              {t("dashboard.kyc.verified")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.kyc.verifiedDesc")}
            </p>
          </div>
        </div>
      )}
      {kycStatus === "pending" && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
          <ShieldAlert className="h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">
              {t("dashboard.kyc.pending")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.kyc.pendingDesc")}
            </p>
          </div>
        </div>
      )}
      {kycStatus === "not_registered" && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/5 p-4">
          <ShieldX className="h-5 w-5 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">
              {t("dashboard.kyc.notRegistered")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.kyc.notRegisteredDesc")}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.myHoldings")}</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(totalHoldingsValue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.unclaimedYield")}</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(unclaimedYield / 1_000_000_000)}{" "}
                <span className="text-xs text-muted-foreground">USDC</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("dashboard.totalEarned")}</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(totalEarned / 1_000_000_000)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground">
            {t("dashboard.holdings")}
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
            {t("dashboard.claimYield")}
          </Button>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("dashboard.noHoldings")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">
                    {t("dashboard.table.asset")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    {t("dashboard.table.symbol")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    {t("dashboard.table.tokens")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    {t("dashboard.table.value")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => (
                  <TableRow
                    key={h.mint}
                    className="border-border hover:bg-secondary"
                  >
                    <TableCell className="text-sm text-foreground">
                      <Link href={`/assets/${h.mint}`} className="hover:text-gold underline-offset-4 hover:underline">
                        {h.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-gold/30 text-gold text-xs"
                      >
                        {h.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-foreground">
                      {formatNumber(h.balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-foreground">
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Send className="h-4 w-4 text-gold" />
            {t("dashboard.transferTokens")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("dashboard.recipientAddress")}
              </Label>
              <Input
                placeholder={t("dashboard.recipientPlaceholder")}
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                className="bg-background border-border text-foreground font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("dashboard.amountTokens")}
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="bg-background border-border text-foreground font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">
              {t("dashboard.transferNote")}
            </p>
            <Button
              onClick={handleTransfer}
              disabled={
                transferring ||
                !transferRecipient ||
                !transferAmount ||
                kycStatus !== "verified"
              }
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              {transferring ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              {t("dashboard.sendTokens")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Assets */}
      {allAssets.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              {t("dashboard.availableAssets")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.availableAssetsDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAssets.map((asset) => {
                const pricePerToken = asset.maxSupply > 0 ? asset.valuationUsd / asset.maxSupply : 0;
                const held = holdings.find((h) => h.mint === asset.mint);
                return (
                  <Link key={asset.mint} href={`/assets/${asset.mint}`} className="block">
                    <div className="rounded-lg border border-border bg-background p-4 hover:border-gold/40 transition-colors space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{asset.name}</p>
                          <Badge variant="outline" className="border-gold/30 text-gold text-xs mt-1">
                            {asset.symbol}
                          </Badge>
                        </div>
                        {asset.isActive ? (
                          <Badge className="bg-success/10 text-success border-0 text-xs">{t("common.active")}</Badge>
                        ) : (
                          <Badge className="bg-muted/10 text-muted-foreground border-0 text-xs">{t("common.inactive")}</Badge>
                        )}
                      </div>
                      <Separator className="bg-border" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">{t("admin.valuation")}</p>
                          <p className="font-mono text-foreground">{formatCurrency(asset.valuationUsd)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("dashboard.pricePerToken")}</p>
                          <p className="font-mono text-foreground">{formatCurrency(pricePerToken)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("asset.tokensIssued")}</p>
                          <p className="font-mono text-foreground">{formatNumber(asset.totalSupply)} / {formatNumber(asset.maxSupply)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("dashboard.table.tokens")}</p>
                          <p className="font-mono text-foreground">{held ? formatNumber(held.balance) : "—"}</p>
                        </div>
                      </div>
                      {!held && kycStatus !== "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-gold/30 text-gold hover:bg-gold/10 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!publicKey) return;
                            const key = "sandyq-access-requests";
                            const existing = JSON.parse(localStorage.getItem(key) || "[]");
                            const already = existing.some((r: any) => r.wallet === publicKey.toBase58() && r.mint === asset.mint);
                            if (!already) {
                              existing.push({ wallet: publicKey.toBase58(), mint: asset.mint, assetName: asset.name, symbol: asset.symbol, timestamp: Date.now() });
                              localStorage.setItem(key, JSON.stringify(existing));
                            }
                            toast.success(t("asset.requestSent"));
                          }}
                        >
                          {t("dashboard.requestAccess")}
                        </Button>
                      )}
                      {(held || kycStatus === "verified") && (
                        <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:text-foreground text-xs">
                          {t("dashboard.viewAsset")}
                        </Button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
