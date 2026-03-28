import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { RwaCore } from "./idl/rwa_core";
import { ComplianceHook } from "./idl/compliance_hook";
import rwaCoreIdl from "./idl/rwa_core.json";
import complianceHookIdl from "./idl/compliance_hook.json";
import {
  RWA_CORE_PROGRAM_ID,
  COMPLIANCE_HOOK_PROGRAM_ID,
} from "./constants";

export function getRwaCoreProgram(provider: AnchorProvider) {
  return new Program<RwaCore>(rwaCoreIdl as any, provider);
}

export function getComplianceHookProgram(provider: AnchorProvider) {
  return new Program<ComplianceHook>(complianceHookIdl as any, provider);
}

// PDA derivations
export function getAssetConfigPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("asset_config"), mint.toBuffer()],
    RWA_CORE_PROGRAM_ID
  );
}

export function getInvestorRecordPda(
  mint: PublicKey,
  wallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("investor"), mint.toBuffer(), wallet.toBuffer()],
    COMPLIANCE_HOOK_PROGRAM_ID
  );
}

export function getYieldVaultPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("yield_vault"), mint.toBuffer()],
    RWA_CORE_PROGRAM_ID
  );
}

export function getInvestorYieldPda(
  mint: PublicKey,
  wallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("investor_yield"), mint.toBuffer(), wallet.toBuffer()],
    RWA_CORE_PROGRAM_ID
  );
}

export function getFreezeAuthorityPda(
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("freeze_authority"), mint.toBuffer()],
    RWA_CORE_PROGRAM_ID
  );
}

export function getMintAuthorityPda(
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority"), mint.toBuffer()],
    RWA_CORE_PROGRAM_ID
  );
}

export function getExtraAccountMetaListPda(
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    COMPLIANCE_HOOK_PROGRAM_ID
  );
}

export function getAttestationPda(
  mint: PublicKey,
  documentHash: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      mint.toBuffer(),
      Buffer.from(documentHash),
    ],
    RWA_CORE_PROGRAM_ID
  );
}

// Error parsing
const ERROR_MAP: Record<number, string> = {
  // rwa_core errors
  6000: "Not authorized",
  6001: "Recipient not KYC verified",
  6002: "Sender not KYC verified",
  6003: "KYC verification expired",
  6004: "Already KYC approved",
  6005: "Already KYC revoked",
  6006: "Asset is not active",
  6007: "Max supply exceeded",
  6008: "Insufficient balance",
  6009: "No yield available to claim",
  6010: "Cannot deposit yield with zero supply",
  6011: "Invalid document hash",
  6012: "Transfer not allowed by compliance",
};

export function parseAnchorError(error: any): string {
  // Anchor error with code
  if (error?.error?.errorCode?.number) {
    const code = error.error.errorCode.number;
    return ERROR_MAP[code] || `Program error: ${code}`;
  }
  // Search error message for custom program error code
  const msg = error?.message || error?.toString() || "";
  const match = msg.match(/custom program error: 0x([0-9a-fA-F]+)/);
  if (match) {
    const code = parseInt(match[1], 16);
    return ERROR_MAP[code] || `Program error: ${code}`;
  }
  // Anchor InstructionError
  if (msg.includes("InstructionError")) {
    const codeMatch = msg.match(/Custom\((\d+)\)/);
    if (codeMatch) {
      const code = parseInt(codeMatch[1]);
      return ERROR_MAP[code] || `Program error: ${code}`;
    }
  }
  return msg || "Unknown error";
}
