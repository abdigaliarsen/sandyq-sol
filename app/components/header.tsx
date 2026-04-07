"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { NETWORK, truncateAddress } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

export function Header() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { publicKey, disconnect, connected } = useWallet();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
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
          <span className="text-xs font-mono text-muted-foreground">
            {truncateAddress(publicKey.toBase58())}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
        {mounted && <WalletMultiButton />}
        {mounted && connected && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
            className="border-border text-muted-foreground hover:text-danger hover:border-danger/30 hover:bg-danger/5 h-8 px-2"
            title={t("header.disconnectWallet")}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
