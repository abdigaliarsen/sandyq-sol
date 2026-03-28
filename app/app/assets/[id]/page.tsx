"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
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
  DEMO_ASSET,
  formatCurrency,
  formatNumber,
  truncateAddress,
} from "@/lib/constants";
import { getRwaCoreProgram, getAssetConfigPda } from "@/lib/programs";

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
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAsset();
  }, [id, connection]);

  async function loadAsset() {
    setLoading(true);
    if (id === "demo") {
      setAsset({
        name: DEMO_ASSET.name,
        symbol: DEMO_ASSET.symbol,
        assetType: DEMO_ASSET.assetType,
        jurisdiction: DEMO_ASSET.jurisdiction,
        valuationUsd: DEMO_ASSET.valuationUsd,
        maxSupply: DEMO_ASSET.maxSupply,
        totalSupply: 0,
        isActive: true,
        authority: "Demo..Auth",
        mint: "demo",
        attestationCount: 3,
        createdAt: Date.now() / 1000,
      });
      setAttestations([
        {
          pubkey: "att1",
          documentName: "Title Deed - Nurly Tau Block 1B",
          documentHash:
            "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
          documentUri: "https://ipfs.io/ipfs/QmDemo1",
          timestamp: Date.now() / 1000 - 86400 * 30,
        },
        {
          pubkey: "att2",
          documentName: "Appraisal Report 2025",
          documentHash:
            "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
          documentUri: "https://ipfs.io/ipfs/QmDemo2",
          timestamp: Date.now() / 1000 - 86400 * 15,
        },
        {
          pubkey: "att3",
          documentName: "Lease Agreement - TechBridge LLP",
          documentHash:
            "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
          documentUri: "https://ipfs.io/ipfs/QmDemo3",
          timestamp: Date.now() / 1000 - 86400 * 7,
        },
      ]);
      setLoading(false);
      return;
    }

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
    } catch (e) {
      console.error("Failed to load asset:", e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[#1E293B] rounded animate-pulse" />
        <div className="h-64 bg-[#111827] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-[#94A3B8]">Asset not found</p>
        <Link href="/" className="text-gold hover:underline text-sm mt-2 inline-block">
          Back to Home
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
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Assets
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
                Active
              </Badge>
            ) : (
              <Badge className="bg-danger/10 text-danger border-0 text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">{asset.name}</h1>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property Info */}
        <Card className="bg-[#111827] border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gold" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#94A3B8]">Property Name</p>
                <p className="text-sm text-[#F1F5F9]">{asset.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Address</p>
                <p className="text-sm text-[#F1F5F9] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#94A3B8]" />
                  {id === "demo" ? DEMO_ASSET.address : asset.jurisdiction}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Valuation</p>
                <p className="text-sm font-mono text-[#F1F5F9]">
                  {formatCurrency(asset.valuationUsd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Asset Type</p>
                <p className="text-sm text-[#F1F5F9]">{asset.assetType}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Jurisdiction</p>
                <p className="text-sm text-[#F1F5F9] flex items-center gap-1">
                  <Globe className="h-3 w-3 text-[#94A3B8]" />
                  {asset.jurisdiction}
                </p>
              </div>
              {id === "demo" && (
                <>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Area</p>
                    <p className="text-sm text-[#F1F5F9]">
                      {DEMO_ASSET.area}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Tenant</p>
                    <p className="text-sm text-[#F1F5F9]">
                      {DEMO_ASSET.tenant}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">Annual Yield</p>
                    <p className="text-sm font-mono text-success">
                      {DEMO_ASSET.yieldPct}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Token Info */}
        <Card className="bg-[#111827] border-border">
          <CardHeader>
            <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
              <Coins className="h-4 w-4 text-gold" />
              Token Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-[#94A3B8]">Symbol</p>
              <p className="text-lg font-mono font-semibold text-gold">
                {asset.symbol}
              </p>
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#94A3B8]">Max Supply</span>
                <span className="font-mono text-[#F1F5F9]">
                  {formatNumber(asset.maxSupply)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#94A3B8]">Issued</span>
                <span className="font-mono text-[#F1F5F9]">
                  {formatNumber(asset.totalSupply)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#94A3B8]">Price / Token</span>
                <span className="font-mono text-[#F1F5F9]">
                  {formatCurrency(pricePerToken)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#94A3B8]">Attestations</span>
                <span className="font-mono text-[#F1F5F9]">
                  {asset.attestationCount}
                </span>
              </div>
            </div>
            {asset.mint !== "demo" && (
              <>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-[#94A3B8]">Mint Address</p>
                  <p className="text-xs font-mono text-[#94A3B8] break-all">
                    {asset.mint}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Authority</p>
                  <p className="text-xs font-mono text-[#94A3B8] break-all">
                    {asset.authority}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attestation Documents */}
      <Card className="bg-[#111827] border-border">
        <CardHeader>
          <CardTitle className="text-base text-[#F1F5F9] flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-gold" />
            Attestation Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attestations.length === 0 ? (
            <p className="text-sm text-[#94A3B8] py-4 text-center">
              No attestations submitted yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[#94A3B8] text-xs">
                    Document
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs">
                    Hash
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs">
                    Date
                  </TableHead>
                  <TableHead className="text-[#94A3B8] text-xs text-right">
                    Verify
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attestations.map((att) => (
                  <TableRow
                    key={att.pubkey}
                    className="border-border hover:bg-[#1E293B]"
                  >
                    <TableCell className="text-sm text-[#F1F5F9]">
                      {att.documentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#94A3B8]">
                      {att.documentHash.slice(0, 8)}...
                      {att.documentHash.slice(-8)}
                    </TableCell>
                    <TableCell className="text-xs text-[#94A3B8]">
                      {new Date(att.timestamp * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={att.documentUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-dark transition-colors"
                      >
                        Verify{" "}
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
