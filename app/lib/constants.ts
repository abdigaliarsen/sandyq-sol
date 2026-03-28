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

// demo mint — replace with actual deployed mint pubkey
export const DEMO_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_DEMO_MINT ||
    "11111111111111111111111111111111"
);

export const DEMO_ASSET = {
  name: "\u0411\u0426 \u00ab\u041d\u0443\u0440\u043b\u044b \u0422\u0430\u0443\u00bb, \u0431\u043b\u043e\u043a 1\u0411, \u043f\u043e\u043c. 512",
  address:
    "\u043c\u043a\u0440. \u0421\u0430\u043c\u0430\u043b-2, \u0443\u043b. \u0416\u043e\u043b\u0434\u0430\u0441\u0431\u0435\u043a\u043e\u0432\u0430 97, \u0410\u043b\u043c\u0430\u0442\u044b",
  valuationKzt: 183_420_000,
  valuationUsd: 376_600,
  area: "287.4 \u043c\u00b2",
  symbol: "SBC4B",
  maxSupply: 10_000,
  yieldPct: 13.8,
  tenant: "TechBridge Consulting LLP",
  assetType: "Commercial Real Estate",
  jurisdiction: "KZ",
};

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
