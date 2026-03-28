"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getRwaCoreProgram, getComplianceHookProgram } from "./programs";

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet?.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  return provider;
}

export function useRwaCoreProgram() {
  const provider = useAnchorProvider();
  return useMemo(() => {
    if (!provider) return null;
    return getRwaCoreProgram(provider);
  }, [provider]);
}

export function useComplianceHookProgram() {
  const provider = useAnchorProvider();
  return useMemo(() => {
    if (!provider) return null;
    return getComplianceHookProgram(provider);
  }, [provider]);
}
