"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { NETWORK, truncateAddress } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

export function Header() {
  const { publicKey } = useWallet();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[#0B0E14]/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={
            NETWORK === "mainnet-beta"
              ? "border-success text-success"
              : "border-warning text-warning"
          }
        >
          {NETWORK === "localnet" ? "localnet" : NETWORK}
        </Badge>
        {publicKey && (
          <span className="text-xs font-mono text-[#94A3B8]">
            {truncateAddress(publicKey.toBase58())}
          </span>
        )}
      </div>
      <WalletMultiButton />
    </header>
  );
}
