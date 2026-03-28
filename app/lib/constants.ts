import { PublicKey } from "@solana/web3.js";

export const RWA_CORE_PROGRAM_ID = new PublicKey(
  "9ZQBB6PWDiBeHbhKZBEyC5wr6C23ohFwrMAw3ugstG8A"
);

export const COMPLIANCE_HOOK_PROGRAM_ID = new PublicKey(
  "D9yfcXGzFWLtyfKXapXxKcBFfDwGJfW7i717bM5YrnSh"
);

export const CLUSTER_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8899";

export const NETWORK: "devnet" | "localnet" | "mainnet-beta" =
  (process.env.NEXT_PUBLIC_NETWORK as any) || "devnet";


export function truncateAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatCurrency(
  amount: number,
  currency = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
