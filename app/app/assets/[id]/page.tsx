"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Building2,
  MapPin,
  Globe,
  FileCheck,
  ExternalLink,
  ArrowLeft,
  Coins,
  Users,
} from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  truncateAddress,
} from "@/lib/constants";
import { getRwaCoreProgram, getComplianceHookProgram, getAssetConfigPda, getInvestorRecordPda } from "@/lib/programs";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { UserPlus, ShieldCheck } from "lucide-react";

interface AssetDetail {
  name: string;
  symbol: string;
  assetType: string;
  jurisdiction: string;
  valuationUsd: number;
  maxSupply: number;
  totalSupply: number;
  isActive: boolean;
  authority: string;
  mint: string;
  attestationCount: number;
  createdAt: number;
}

interface AttestationData {
  pubkey: string;
  documentName: string;
  documentHash: string;
  documentUri: string;
  timestamp: number;
}

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<"verified" | "pending" | "not_registered" | null>(null);

  useEffect(() => {
    loadAsset();
  }, [id, connection]);

  async function loadAsset() {
    setLoading(true);
    try {
      const mint = new PublicKey(id);
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: PublicKey.default,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        } as any,
        { commitment: "confirmed" }
      );
      const program = getRwaCoreProgram(provider);
      const [assetPda] = getAssetConfigPda(mint);
      const config = await (program.account as any).assetConfig.fetch(
        assetPda
      );

      setAsset({
        name: config.name,
        symbol: config.symbol,
        assetType: config.assetType,
        jurisdiction: config.jurisdiction,
        valuationUsd: config.valuationUsd.toNumber(),
        maxSupply: config.maxSupply.toNumber(),
        totalSupply: config.totalSupply.toNumber(),
        isActive: config.isActive,
        authority: config.authority.toBase58(),
        mint: config.mint.toBase58(),
        attestationCount: config.attestationCount,
        createdAt: config.createdAt.toNumber(),
      });

      // fetch attestations
      const allAttestations = await (
        program.account as any
      ).attestation.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: mint.toBase58(),
          },
        },
      ]);

      const parsed: AttestationData[] = allAttestations.map(
        (acc: any) => ({
          pubkey: acc.publicKey.toBase58(),
          documentName: acc.account.documentName,
          documentHash: Buffer.from(acc.account.documentHash).toString(
            "hex"
          ),
          documentUri: acc.account.documentUri,
          timestamp: acc.account.timestamp.toNumber(),
        })
      );
      setAttestations(parsed);

      // Check KYC status
      if (publicKey) {
        const complianceProgram = getComplianceHookProgram(provider);
        const [investorPda] = getInvestorRecordPda(mint, publicKey);
        try {
          const record = await (complianceProgram.account as any).investorRecord.fetch(investorPda);
          setKycStatus(record.isKyc ? "verified" : "pending");
        } catch {
          setKycStatus("not_registered");
        }
      }
    } catch (e) {
      console.error("Failed to load asset:", e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-64 bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("asset.notFound")}</p>
        <Link href="/" className="text-gold hover:underline text-sm mt-2 inline-block">
          {t("asset.backToHome")}
        </Link>
      </div>
    );
  }

  const pricePerToken =
    asset.maxSupply > 0 ? asset.valuationUsd / asset.maxSupply : 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> {t("asset.backToAssets")}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-gold/30 text-gold text-xs"
            >
              {asset.symbol}
            </Badge>
            {asset.isActive ? (
              <Badge className="bg-success/10 text-success border-0 text-xs">
                {t("common.active")}
              </Badge>
            ) : (
              <Badge className="bg-danger/10 text-danger border-0 text-xs">
                {t("common.inactive")}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
        </div>
        <div>
          {kycStatus === "verified" ? (
            <div className="flex items-center gap-2 text-success text-sm">
              <ShieldCheck className="h-4 w-4" />
              {t("dashboard.kyc.verified")}
            </div>
          ) : kycStatus === "not_registered" || kycStatus === "pending" ? (
            <Button
              onClick={() => {
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
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t("asset.requestAccess")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Request Access Banner for non-KYC users */}
      {kycStatus === "not_registered" && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
          <UserPlus className="h-5 w-5 text-warning" />
          <p className="text-sm text-muted-foreground">{t("asset.requestAccessDesc")}</p>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property Info */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gold" />
              {t("asset.propertyInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("asset.propertyName")}</p>
                <p className="text-sm text-foreground">{asset.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("asset.address")}</p>
                <p className="text-sm text-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {asset.jurisdiction}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("asset.valuation")}</p>
                <p className="text-sm font-mono text-foreground">
                  {formatCurrency(asset.valuationUsd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("asset.assetType")}</p>
                <p className="text-sm text-foreground">{asset.assetType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("asset.jurisdiction")}</p>
                <p className="text-sm text-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {asset.jurisdiction}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Coins className="h-4 w-4 text-gold" />
              {t("asset.tokenInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("asset.symbol")}</p>
              <p className="text-lg font-mono font-semibold text-gold">
                {asset.symbol}
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("asset.maxSupply")}</span>
                <span className="font-mono text-foreground">
                  {formatNumber(asset.maxSupply)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("asset.issued")}</span>
                <span className="font-mono text-foreground">
                  {formatNumber(asset.totalSupply)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("asset.pricePerToken")}</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(pricePerToken)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("asset.attestations")}</span>
                <span className="font-mono text-foreground">
                  {asset.attestationCount}
                </span>
              </div>
            </div>
            <Separator className="bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">{t("asset.mintAddress")}</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {asset.mint}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("asset.authority")}</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {asset.authority}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attestation Documents */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-gold" />
            {t("asset.attestationDocuments")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attestations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("asset.noAttestations")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">
                    {t("asset.table.document")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    {t("asset.table.hash")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    {t("asset.table.date")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    {t("asset.table.verify")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attestations.map((att) => (
                  <TableRow
                    key={att.pubkey}
                    className="border-border hover:bg-secondary"
                  >
                    <TableCell className="text-sm text-foreground">
                      {att.documentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {att.documentHash.slice(0, 8)}...
                      {att.documentHash.slice(-8)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(att.timestamp * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={att.documentUri.startsWith("ipfs://")
                          ? `${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "http://localhost:8080"}/ipfs/${att.documentUri.slice(7)}`
                          : att.documentUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-dark transition-colors"
                      >
                        {t("asset.table.verify")}{" "}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
