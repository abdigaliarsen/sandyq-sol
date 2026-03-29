"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeTransferHookInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializeMint2Instruction,
  createSetAuthorityInstruction,
  createAssociatedTokenAccountInstruction,
  AccountState,
  AuthorityType,
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
  Plus,
  Check,
  FileText,
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
  getFreezeAuthorityPda,
  getMintAuthorityPda,
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
  const { t } = useTranslation();

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
  const [yieldRewardMint, setYieldRewardMint] = useState("");
  const [forceFromWallet, setForceFromWallet] = useState("");
  const [forceToWallet, setForceToWallet] = useState("");
  const [forceAmount, setForceAmount] = useState("");

  // Create Asset form states
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [createAssetForm, setCreateAssetForm] = useState({
    name: "",
    symbol: "",
    assetType: "",
    jurisdiction: "",
    maxSupply: "",
    valuationUsd: "",
  });
  const [createAssetStep, setCreateAssetStep] = useState(0);
  const [createAssetStepStatus, setCreateAssetStepStatus] = useState<
    Array<"pending" | "loading" | "done" | "error">
  >(["pending", "pending", "pending", "pending", "pending"]);
  const [createAssetError, setCreateAssetError] = useState<string | null>(null);
  const [createdMintKeypair, setCreatedMintKeypair] = useState<Keypair | null>(null);
  const [createdMintPubkey, setCreatedMintPubkey] = useState<PublicKey | null>(null);

  // Attestation form states
  const [attestDocName, setAttestDocName] = useState("");
  const [attestDocUri, setAttestDocUri] = useState("");
  const [attestDocHashManual, setAttestDocHashManual] = useState("");

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
        { memcmp: { offset: 8 + 32 + 32, bytes: mintPk.toBase58() } },
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

  const CREATE_ASSET_STEPS = [
    t("admin.createStep1"),
    t("admin.createStep2"),
    t("admin.createStep3"),
    t("admin.createStep4"),
    t("admin.createStep5"),
  ];

  async function handleCreateAsset(resumeFromStep?: number) {
    if (!publicKey || !sendTransaction) return;
    const { name, symbol, assetType, jurisdiction, maxSupply, valuationUsd } = createAssetForm;
    if (!name || !symbol || !assetType || !jurisdiction || !maxSupply || !valuationUsd) {
      toast.error(t("admin.toast.allFieldsRequired"));
      return;
    }

    const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
    const program = getRwaCoreProgram(provider);
    const hookProgram = getComplianceHookProgram(provider);

    const startStep = resumeFromStep ?? 0;
    let mintKeypair = createdMintKeypair;
    let mint = createdMintPubkey;

    if (startStep === 0) {
      mintKeypair = Keypair.generate();
      mint = mintKeypair.publicKey;
      setCreatedMintKeypair(mintKeypair);
      setCreatedMintPubkey(mint);
    }

    if (!mintKeypair || !mint) {
      toast.error(t("admin.toast.mintKeypairNotFound"));
      return;
    }

    setCreateAssetError(null);
    const statuses: Array<"pending" | "loading" | "done" | "error"> = [...createAssetStepStatus];

    const [freezeAuthorityPda] = getFreezeAuthorityPda(mint);
    const [mintAuthorityPda] = getMintAuthorityPda(mint);

    async function runStep(stepIndex: number): Promise<boolean> {
      statuses[stepIndex] = "loading";
      setCreateAssetStepStatus([...statuses]);
      setCreateAssetStep(stepIndex);

      try {
        if (stepIndex === 0) {
          // Step 1: Create Token-2022 mint with extensions
          const extensions = [
            ExtensionType.TransferHook,
            ExtensionType.PermanentDelegate,
            ExtensionType.DefaultAccountState,
          ];
          const mintLen = getMintLen(extensions);
          const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

          const tx1 = new Transaction().add(
            SystemProgram.createAccount({
              fromPubkey: publicKey!,
              newAccountPubkey: mint!,
              space: mintLen,
              lamports,
              programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeTransferHookInstruction(
              mint!, publicKey!, COMPLIANCE_HOOK_PROGRAM_ID, TOKEN_2022_PROGRAM_ID
            ),
            createInitializePermanentDelegateInstruction(
              mint!, mintAuthorityPda, TOKEN_2022_PROGRAM_ID
            ),
            createInitializeDefaultAccountStateInstruction(
              mint!, AccountState.Frozen, TOKEN_2022_PROGRAM_ID
            ),
            createInitializeMint2Instruction(
              mint!, 0, publicKey!, freezeAuthorityPda, TOKEN_2022_PROGRAM_ID
            ),
          );

          tx1.feePayer = publicKey!;
          tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx1.partialSign(mintKeypair!);
          const sig1 = await sendTransaction(tx1, connection);
          await connection.confirmTransaction(sig1, "confirmed");
        } else if (stepIndex === 1) {
          // Step 2: Transfer mint authority to PDA
          const tx2 = new Transaction().add(
            createSetAuthorityInstruction(
              mint!, publicKey!, AuthorityType.MintTokens, mintAuthorityPda, [], TOKEN_2022_PROGRAM_ID
            ),
          );
          const sig2 = await sendTransaction(tx2, connection);
          await connection.confirmTransaction(sig2, "confirmed");
        } else if (stepIndex === 2) {
          // Step 3: Create asset config
          await (program.methods as any)
            .createAsset(name, symbol, assetType, jurisdiction, new BN(maxSupply), new BN(valuationUsd))
            .accounts({ authority: publicKey, mint })
            .rpc();
        } else if (stepIndex === 3) {
          // Step 4: Initialize extra account meta list
          await (hookProgram.methods as any)
            .initializeExtraAccountMetaList()
            .accounts({ payer: publicKey, mint, authority: publicKey })
            .rpc();
        } else if (stepIndex === 4) {
          // Step 5: Register treasury + create ATA + approve KYC
          // Register admin as investor with is_authority=true
          await (hookProgram.methods as any)
            .registerInvestor(true)
            .accounts({ payer: publicKey, authority: publicKey, wallet: publicKey, mint })
            .rpc();

          // Create treasury ATA
          const treasuryAta = getAssociatedTokenAddressSync(
            mint!, publicKey!, false, TOKEN_2022_PROGRAM_ID
          );
          const ataTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              publicKey!, treasuryAta, publicKey!, mint!, TOKEN_2022_PROGRAM_ID
            ),
          );
          const sigAta = await sendTransaction(ataTx, connection);
          await connection.confirmTransaction(sigAta, "confirmed");

          // Approve own KYC to thaw the account
          const [treasuryRecord] = getInvestorRecordPda(mint!, publicKey!);
          const [freezeAuth] = getFreezeAuthorityPda(mint!);
          await (program.methods as any)
            .approveKyc()
            .accounts({
              authority: publicKey,
              mint,
              investorRecord: treasuryRecord,
              investorTokenAccount: treasuryAta,
              freezeAuthority: freezeAuth,
              complianceHookProgram: COMPLIANCE_HOOK_PROGRAM_ID,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .rpc();
        }

        statuses[stepIndex] = "done";
        setCreateAssetStepStatus([...statuses]);
        return true;
      } catch (e: any) {
        statuses[stepIndex] = "error";
        setCreateAssetStepStatus([...statuses]);
        setCreateAssetError(parseAnchorError(e));
        return false;
      }
    }

    for (let i = startStep; i < 5; i++) {
      const ok = await runStep(i);
      if (!ok) return;
    }

    toast.success(t("admin.toast.assetCreated"));
    setShowCreateAsset(false);
    setCreateAssetStep(0);
    setCreateAssetStepStatus(["pending", "pending", "pending", "pending", "pending"]);
    setCreateAssetForm({ name: "", symbol: "", assetType: "", jurisdiction: "", maxSupply: "", valuationUsd: "" });
    setCreatedMintKeypair(null);
    setCreatedMintPubkey(null);
    loadAdmin();
  }

  async function handleSubmitAttestation() {
    if (!publicKey || !selectedAsset || !attestDocName || !attestDocUri) return;
    setActionLoading("attestation");
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const program = getRwaCoreProgram(provider);
      const mint = new PublicKey(selectedAsset.mint);

      // Compute SHA-256 hash of document URI
      let documentHash: number[];
      if (attestDocHashManual && attestDocHashManual.length === 64) {
        // Manual hex input
        const bytes = [];
        for (let i = 0; i < 64; i += 2) {
          bytes.push(parseInt(attestDocHashManual.substring(i, i + 2), 16));
        }
        documentHash = bytes;
      } else {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(attestDocUri);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
        documentHash = Array.from(new Uint8Array(hashBuffer));
      }

      await (program.methods as any)
        .submitAttestation(documentHash, attestDocName, attestDocUri)
        .accounts({ authority: publicKey, mint })
        .rpc();

      toast.success(t("admin.toast.attestationSubmitted"));
      setAttestDocName("");
      setAttestDocUri("");
      setAttestDocHashManual("");
    } catch (e: any) {
      toast.error(parseAnchorError(e));
    }
    setActionLoading(null);
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

      toast.success(t("admin.toast.investorRegistered"), {
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

      toast.success(t("admin.toast.kycApproved"), {
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

      toast.success(t("admin.toast.kycRevoked"), {
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

      toast.success(t("admin.toast.tokensIssued"), {
        description: t("admin.toast.tokensIssuedDesc", { amount: issueAmount, symbol: selectedAsset.symbol, tx: truncateAddress(tx, 8) }),
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
    if (!publicKey || !selectedAsset || !yieldAmount || !yieldRewardMint) return;
    setActionLoading("yield");
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const rwaMint = new PublicKey(selectedAsset.mint);
      const rewardMint = new PublicKey(yieldRewardMint);

      // Determine which token program the reward mint uses
      const rewardMintInfo = await connection.getAccountInfo(rewardMint);
      const rewardTokenProgram = rewardMintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID;

      const [yieldVaultPda] = getYieldVaultPda(rwaMint);

      const authorityRewardAccount = getAssociatedTokenAddressSync(
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

      // Ensure vault reward ATA exists
      const vaultRewardInfo = await connection.getAccountInfo(vaultRewardAccount);
      if (!vaultRewardInfo) {
        const createVaultAtaTx = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            vaultRewardAccount,
            yieldVaultPda,
            rewardMint,
            rewardTokenProgram
          )
        );
        const ataSig = await sendTransaction(createVaultAtaTx, connection);
        await connection.confirmTransaction(ataSig, "confirmed");
      }

      const tx = await (program.methods as any)
        .depositYield(new BN(yieldAmount))
        .accounts({
          authority: publicKey,
          rwaMint,
          rewardMint,
          authorityRewardAccount,
          vaultRewardAccount,
          tokenProgram: rewardTokenProgram,
        })
        .rpc();

      toast.success(t("admin.toast.yieldDeposited"), {
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

      toast.success(t("admin.toast.forceTransferComplete"), {
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
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          {t("admin.accessRequired")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.accessRequiredDesc")}
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-96 bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!isAdmin && !showCreateAsset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h2 className="text-xl font-semibold text-foreground">
          {t("admin.notAuthorized")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.notAuthorizedDesc")}
        </p>
        <Button
          onClick={() => setShowCreateAsset(true)}
          className="bg-gold text-primary-foreground hover:bg-gold-dark mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.createNewAsset")}
        </Button>
      </div>
    );
  }

  if (showCreateAsset) {
    const isRunning = createAssetStepStatus.some((s) => s === "loading");
    const failedStep = createAssetStepStatus.findIndex((s) => s === "error");

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.createNewAsset")}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCreateAsset(false);
              setCreateAssetStep(0);
              setCreateAssetStepStatus(["pending", "pending", "pending", "pending", "pending"]);
              setCreateAssetError(null);
              setCreatedMintKeypair(null);
              setCreatedMintPubkey(null);
            }}
            className="border-border text-muted-foreground"
          >
            {t("admin.cancel")}
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-gold" />
              {t("admin.assetDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.assetName")}</Label>
                <Input
                  placeholder={t("admin.assetNamePlaceholder")}
                  value={createAssetForm.name}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.symbolLabel")}</Label>
                <Input
                  placeholder={t("admin.symbolPlaceholder")}
                  value={createAssetForm.symbol}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, symbol: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.assetTypeLabel")}</Label>
                <Input
                  placeholder={t("admin.assetTypePlaceholder")}
                  value={createAssetForm.assetType}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, assetType: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.jurisdictionLabel")}</Label>
                <Input
                  placeholder={t("admin.jurisdictionPlaceholder")}
                  value={createAssetForm.jurisdiction}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, jurisdiction: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.maxSupplyTokens")}</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={createAssetForm.maxSupply}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, maxSupply: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.valuationUsdCents")}</Label>
                <Input
                  type="number"
                  placeholder="37660000"
                  value={createAssetForm.valuationUsd}
                  onChange={(e) => setCreateAssetForm((f) => ({ ...f, valuationUsd: e.target.value }))}
                  disabled={isRunning}
                  className="bg-background border-border text-foreground font-mono text-xs"
                />
                {createAssetForm.valuationUsd && (
                  <p className="text-xs text-muted-foreground/60">
                    = ${(Number(createAssetForm.valuationUsd) / 100).toLocaleString()} USD
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">
              {t("admin.creationProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CREATE_ASSET_STEPS.map((stepName, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {createAssetStepStatus[i] === "done" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : createAssetStepStatus[i] === "loading" ? (
                    <Loader2 className="h-4 w-4 text-gold animate-spin" />
                  ) : createAssetStepStatus[i] === "error" ? (
                    <AlertTriangle className="h-4 w-4 text-danger" />
                  ) : (
                    <span className="text-xs text-muted-foreground/60 font-mono">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    createAssetStepStatus[i] === "done"
                      ? "text-success"
                      : createAssetStepStatus[i] === "loading"
                      ? "text-gold"
                      : createAssetStepStatus[i] === "error"
                      ? "text-danger"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("admin.step")} {i + 1}/5: {stepName}
                </span>
              </div>
            ))}

            {createAssetError && (
              <div className="mt-3 p-3 rounded bg-danger/10 border border-danger/20">
                <p className="text-xs text-danger">{createAssetError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {failedStep >= 0 ? (
                <Button
                  onClick={() => handleCreateAsset(failedStep)}
                  className="bg-gold text-primary-foreground hover:bg-gold-dark"
                >
                  {t("admin.retryFromStep", { step: String(failedStep + 1) })}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCreateAsset()}
                  disabled={
                    isRunning ||
                    !createAssetForm.name ||
                    !createAssetForm.symbol ||
                    !createAssetForm.assetType ||
                    !createAssetForm.jurisdiction ||
                    !createAssetForm.maxSupply ||
                    !createAssetForm.valuationUsd
                  }
                  className="bg-gold text-primary-foreground hover:bg-gold-dark"
                >
                  {isRunning ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  {isRunning ? t("admin.creating") : t("admin.createAsset")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>
        <div className="flex items-center gap-3">
          {selectedAsset && (
            <Badge variant="outline" className="border-gold/30 text-gold">
              {selectedAsset.symbol} - {truncateAddress(selectedAsset.mint)}
            </Badge>
          )}
          <Button
            onClick={() => setShowCreateAsset(true)}
            size="sm"
            className="bg-gold text-primary-foreground hover:bg-gold-dark"
          >
            <Plus className="h-3 w-3 mr-1" />
            {t("admin.createNewAsset")}
          </Button>
        </div>
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
                  ? "bg-gold text-primary-foreground"
                  : "border-border text-muted-foreground"
              }
            >
              {a.symbol}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="investors" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="investors"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <Users className="h-3 w-3 mr-1" /> {t("admin.tab.investors")}
          </TabsTrigger>
          <TabsTrigger
            value="distributions"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <DollarSign className="h-3 w-3 mr-1" /> {t("admin.tab.distributions")}
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <Shield className="h-3 w-3 mr-1" /> {t("admin.tab.compliance")}
          </TabsTrigger>
          <TabsTrigger
            value="attestations"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            <FileText className="h-3 w-3 mr-1" /> {t("admin.tab.attestations")}
          </TabsTrigger>
        </TabsList>

        {/* INVESTORS TAB */}
        <TabsContent value="investors" className="space-y-4">
          {/* Register new investor */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-gold" />
                {t("admin.registerAndIssue")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.investorWallet")}
                  </Label>
                  <Input
                    placeholder={t("admin.investorWalletPlaceholder")}
                    value={registerWallet}
                    onChange={(e) => setRegisterWallet(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleRegisterInvestor}
                    disabled={
                      actionLoading === "register" || !registerWallet
                    }
                    className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                  >
                    {actionLoading === "register" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3 mr-1" />
                    )}
                    {t("admin.register")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.issueTo")}
                  </Label>
                  <Input
                    placeholder={t("admin.issueToPlaceholder")}
                    value={issueWallet}
                    onChange={(e) => setIssueWallet(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("common.amount")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={issueAmount}
                    onChange={(e) => setIssueAmount(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
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
                    className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                  >
                    {actionLoading === "issue" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Coins className="h-3 w-3 mr-1" />
                    )}
                    {t("admin.issueTokens")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investors table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                {t("admin.registeredInvestors")} ({investors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("admin.noInvestors")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">
                        {t("admin.table.wallet")}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        {t("admin.table.kycStatus")}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        {t("admin.table.role")}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        {t("admin.table.registered")}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">
                        {t("admin.table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investors.map((inv) => (
                      <TableRow
                        key={inv.recordPda}
                        className="border-border hover:bg-secondary"
                      >
                        <TableCell className="font-mono text-xs text-foreground">
                          {truncateAddress(inv.wallet, 6)}
                        </TableCell>
                        <TableCell>
                          {inv.isKyc ? (
                            <Badge className="bg-success/10 text-success border-0 text-xs">
                              {t("common.verified")}
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/10 text-warning border-0 text-xs">
                              {t("common.pending")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.isAuthority ? t("admin.role.authority") : t("admin.role.investor")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
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
                              {t("admin.approve")}
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
                              {t("admin.revoke")}
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold" />
                {t("admin.depositYield")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs text-muted-foreground">
                    Reward Mint Address
                  </Label>
                  <Input
                    placeholder="Reward token mint (e.g. USDC mint address)"
                    value={yieldRewardMint}
                    onChange={(e) => setYieldRewardMint(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.amountUsdcLamports")}
                  </Label>
                  <Input
                    type="number"
                    placeholder={t("admin.amountPlaceholder")}
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                  {yieldAmount &&
                    selectedAsset &&
                    selectedAsset.totalSupply > 0 && (
                      <p className="text-xs text-muted-foreground/60">
                        {t("admin.perTokenYield")}{" "}
                        {(
                          Number(yieldAmount) /
                          selectedAsset.totalSupply
                        ).toFixed(2)}{" "}
                        {t("admin.lamportsPerToken")}
                      </p>
                    )}
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleDepositYield}
                    disabled={
                      actionLoading === "yield" || !yieldAmount || !yieldRewardMint
                    }
                    className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                  >
                    {actionLoading === "yield" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <DollarSign className="h-3 w-3 mr-1" />
                    )}
                    {t("admin.depositYield")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset stats */}
          {selectedAsset && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  {t("admin.assetOverview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.totalSupply")}</p>
                    <p className="text-lg font-mono text-foreground">
                      {formatNumber(selectedAsset.totalSupply)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.maxSupply")}</p>
                    <p className="text-lg font-mono text-foreground">
                      {formatNumber(selectedAsset.maxSupply)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.valuation")}</p>
                    <p className="text-lg font-mono text-foreground">
                      {formatCurrency(selectedAsset.valuationUsd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.investors")}</p>
                    <p className="text-lg font-mono text-foreground">
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
          <Card className="bg-card border-border border-danger/20">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-danger" />
                {t("admin.forceTransfer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground/60">
                {t("admin.forceTransferDesc")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.fromWallet")}
                  </Label>
                  <Input
                    placeholder={t("admin.fromWalletPlaceholder")}
                    value={forceFromWallet}
                    onChange={(e) =>
                      setForceFromWallet(e.target.value)
                    }
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("admin.toWallet")}
                  </Label>
                  <Input
                    placeholder={t("admin.toWalletPlaceholder")}
                    value={forceToWallet}
                    onChange={(e) => setForceToWallet(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("common.amount")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={forceAmount}
                    onChange={(e) => setForceAmount(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
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
                {t("admin.executeForceTransfer")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTESTATIONS TAB */}
        <TabsContent value="attestations" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold" />
                {t("admin.submitAttestation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground/60">
                {t("admin.attestDescription")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.attestDocName")}</Label>
                  <Input
                    placeholder={t("admin.attestPlaceholderDocName")}
                    value={attestDocName}
                    onChange={(e) => setAttestDocName(e.target.value)}
                    className="bg-background border-border text-foreground text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("admin.attestDocUri")}</Label>
                  <Input
                    placeholder="ipfs://..."
                    value={attestDocUri}
                    onChange={(e) => setAttestDocUri(e.target.value)}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("admin.attestDocHash")}
                </Label>
                <Input
                  placeholder={t("admin.attestPlaceholderHash")}
                  value={attestDocHashManual}
                  onChange={(e) => setAttestDocHashManual(e.target.value)}
                  className="bg-background border-border text-foreground font-mono text-xs"
                />
              </div>
              <Button
                onClick={handleSubmitAttestation}
                disabled={
                  actionLoading === "attestation" ||
                  !attestDocName ||
                  !attestDocUri
                }
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                {actionLoading === "attestation" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3 mr-1" />
                )}
                {t("admin.submitAttestation")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
