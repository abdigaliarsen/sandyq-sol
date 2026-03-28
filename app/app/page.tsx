"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Coins, ArrowRight } from "lucide-react";
import {
  DEMO_ASSET,
  formatCurrency,
  formatNumber,
} from "@/lib/constants";
import { getRwaCoreProgram } from "@/lib/programs";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

interface AssetData {
  pubkey: string;
  mint: string;
  name: string;
  symbol: string;
  assetType: string;
  jurisdiction: string;
  valuationUsd: number;
  maxSupply: number;
  totalSupply: number;
  isActive: boolean;
}

export default function HomePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, [connection]);

  async function loadAssets() {
    setLoading(true);
    try {
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
      const accounts = await (program.account as any).assetConfig.all();

      if (accounts.length > 0) {
        const parsed: AssetData[] = accounts.map((acc: any) => ({
          pubkey: acc.publicKey.toBase58(),
          mint: acc.account.mint.toBase58(),
          name: acc.account.name,
          symbol: acc.account.symbol,
          assetType: acc.account.assetType,
          jurisdiction: acc.account.jurisdiction,
          valuationUsd: acc.account.valuationUsd.toNumber(),
          maxSupply: acc.account.maxSupply.toNumber(),
          totalSupply: acc.account.totalSupply.toNumber(),
          isActive: acc.account.isActive,
        }));
        setAssets(parsed);
      } else {
        setAssets([demoAsset()]);
      }
    } catch {
      setAssets([demoAsset()]);
    }
    setLoading(false);
  }

  function demoAsset(): AssetData {
    return {
      pubkey: "demo",
      mint: "demo",
      name: DEMO_ASSET.name,
      symbol: DEMO_ASSET.symbol,
      assetType: DEMO_ASSET.assetType,
      jurisdiction: DEMO_ASSET.jurisdiction,
      valuationUsd: DEMO_ASSET.valuationUsd,
      maxSupply: DEMO_ASSET.maxSupply,
      totalSupply: 0,
      isActive: true,
    };
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#111827] to-[#0B0E14] p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-xl font-bold text-[#0B0E14]">S</span>
            </div>
            <h1 className="text-4xl font-bold text-[#F1F5F9]">Sandyq</h1>
          </div>
          <p className="text-xl text-[#94A3B8]">
            Compliance-gated real world asset tokenization on Solana.
            Invest in verified properties with on-chain KYC and yield
            distribution.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {!wallet.publicKey ? (
              <WalletMultiButton />
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-[#0B0E14] hover:bg-gold-dark transition-colors"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="flex gap-6 pt-4 text-sm">
            <div>
              <span className="text-[#475569]">Protocol</span>
              <p className="font-mono text-gold">Token-2022</p>
            </div>
            <div>
              <span className="text-[#475569]">Compliance</span>
              <p className="font-mono text-gold">Transfer Hook</p>
            </div>
            <div>
              <span className="text-[#475569]">Network</span>
              <p className="font-mono text-gold">Solana</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Total Assets</p>
              <p className="text-xl font-semibold text-[#F1F5F9]">
                {assets.length}
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
              <p className="text-xs text-[#94A3B8]">Total Valuation</p>
              <p className="text-xl font-semibold text-[#F1F5F9]">
                {formatCurrency(
                  assets.reduce((s, a) => s + a.valuationUsd, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold/10 flex items-center justify-center">
              <Coins className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Avg. Yield</p>
              <p className="text-xl font-semibold text-success">
                {DEMO_ASSET.yieldPct}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Cards */}
      <section>
        <h2 className="text-2xl font-semibold text-[#F1F5F9] mb-4">
          Tokenized Assets
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="bg-[#111827] border-border animate-pulse h-52"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <Link
                key={asset.pubkey}
                href={
                  asset.pubkey === "demo"
                    ? `/assets/demo`
                    : `/assets/${asset.mint}`
                }
              >
                <Card className="bg-[#111827] border-border hover:border-gold/30 hover:bg-[#1E293B] transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
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
                    <CardTitle className="text-base text-[#F1F5F9] leading-tight mt-2">
                      {asset.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94A3B8]">Valuation</span>
                      <span className="font-mono text-[#F1F5F9]">
                        {formatCurrency(asset.valuationUsd)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94A3B8]">Max Supply</span>
                      <span className="font-mono text-[#F1F5F9]">
                        {formatNumber(asset.maxSupply)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94A3B8]">Issued</span>
                      <span className="font-mono text-[#F1F5F9]">
                        {formatNumber(asset.totalSupply)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94A3B8]">Annual Yield</span>
                      <span className="font-mono text-success font-medium">
                        {DEMO_ASSET.yieldPct}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94A3B8]">Type</span>
                      <span className="text-[#F1F5F9]">
                        {asset.assetType}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center gap-1 text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
