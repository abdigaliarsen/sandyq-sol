"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { ThemeProvider } from "next-themes";
import { CLUSTER_URL } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";

import "@solana/wallet-adapter-react-ui/styles.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Phantom is auto-detected as a Standard Wallet — no manual adapter needed
  const wallets = useMemo(
    () => [new SolflareWalletAdapter()],
    []
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ConnectionProvider endpoint={CLUSTER_URL}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                },
              }}
            />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
