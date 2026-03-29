# Sandyq

**сандық** — chest / vault in Kazakh

Compliance-gated RWA tokenization on Solana

![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
![Token-2022](https://img.shields.io/badge/Token--2022-14F195?style=flat&logo=solana&logoColor=black)
![Anchor](https://img.shields.io/badge/Anchor_0.32.1-1E1E2E?style=flat)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat&logo=nextdotjs&logoColor=white)

---

## Problem

Kazakhstan's AIFC (Astana International Financial Centre) enables security token offerings under its STO Framework (effective January 2024), but no on-chain compliance infrastructure exists for small issuers. Generic tokenization platforms have no transfer restrictions, no KYC enforcement, and no regulatory controls. Issuers must build compliance from scratch every time — or skip it entirely.

## Solution

Sandyq is a compliance-gated RWA tokenization protocol where every token transfer is validated by Solana's Token-2022 Transfer Hook. Non-compliant transfers are rejected at the protocol level — not by an application backend, but by the blockchain itself.

The protocol encodes AIFC STO compliance rules directly into the token: KYC verification, transfer restrictions, regulatory seizure capability, and frozen-by-default accounts. This is programmable compliance, not a wrapper around a PDF.

---

## Architecture

Two Anchor programs with clean separation of concerns:

| Program | Role | Lines |
|---------|------|-------|
| **compliance-hook** | Transfer Hook program. Read-only KYC compliance check on every transfer. Owns InvestorRecord PDAs and ExtraAccountMetaList. | ~350 |
| **rwa-core** | Asset creation, token issuance, KYC management (CPI to compliance-hook), yield distribution, attestation, force transfer. | ~900 |

The transfer hook is deliberately read-only (Token-2022 spec). State mutations live in rwa-core to respect CPI depth limits and avoid reentrancy risks.

### Token-2022 Extensions

| Extension | Purpose |
|-----------|---------|
| **TransferHook** | KYC compliance check on every transfer — both sender and receiver must have `is_kyc = true` |
| **PermanentDelegate** | Regulatory recall/freeze capability — issuer can transfer tokens from any account |
| **DefaultAccountState (Frozen)** | All token accounts start frozen at the protocol level, even if created by a third-party program |
| **MetadataPointer + TokenMetadata** | On-chain asset metadata (property details, jurisdiction, legal entity) stored directly on the mint |

### PDA Layout

```
compliance-hook program:
  InvestorRecord     ["investor", mint, wallet]          — KYC status per investor per asset
  ExtraAccountMetaList ["extra-account-metas", mint]     — hook account resolution

rwa-core program:
  AssetConfig        ["asset_config", mint]              — asset metadata and admin authority
  YieldVault         ["yield_vault", mint]               — reward-per-token accumulator
  InvestorYield      ["investor_yield", mint, wallet]    — per-investor yield snapshot
  Attestation        ["attestation", mint, document_hash] — immutable document proof
  FreezeAuthority    ["freeze_authority", mint]          — PDA-based freeze authority
  MintAuthority      ["mint_authority", mint]            — PDA-based mint authority
```

### Instructions

**compliance-hook:** `initialize_extra_account_meta_list`, `transfer_hook` (via `#[interface]`)

**rwa-core:** `create_asset`, `register_investor`, `approve_kyc`, `revoke_kyc`, `issue_tokens`, `force_transfer`, `deposit_yield`, `claim_yield`, `submit_attestation`

---

## Program Addresses (Devnet)

| Program | Address |
|---------|---------|
| rwa_core | `9ZQBB6PWDiBeHbhKZBEyC5wr6C23ohFwrMAw3ugstG8A` |
| compliance_hook | `D9yfcXGzFWLtyfKXapXxKcBFfDwGJfW7i717bM5YrnSh` |

---

## Getting Started

```bash
git clone https://github.com/abdigaliarsen/sandyq-sol.git
cd sandyq-sol

# Build programs
anchor build

# Run tests (13/13)
anchor test

# Start frontend
cd app
cp .env.example .env.local
npm install
npm run dev
```

---

## Demo Flow

1. **Create Asset** — Admin creates a tokenized asset (Token-2022 mint with TransferHook, PermanentDelegate, DefaultAccountState, MetadataPointer, TokenMetadata)
2. **Register Investors** — Admin registers investor wallets and approves KYC; accounts are unfrozen upon approval
3. **Issue Tokens** — Admin mints tokens to verified investors
4. **Compliant Transfer** — Investors transfer tokens to each other; the Transfer Hook verifies both sender and receiver have `is_kyc = true`
5. **Blocked Transfer** — A transfer to a non-KYC wallet is **rejected by the protocol** at the blockchain level
6. **Deposit Yield** — Admin deposits rental income; global reward-per-token accumulator is updated
7. **Claim Yield** — Investors claim their pro-rata share of accumulated yield
8. **Force Recall** — Admin can recall tokens from any account via PermanentDelegate for regulatory compliance

### Demo Scenario: Tokenized Commercial Property in Almaty

The demo uses a realistic commercial property: **Samal Business Centre, Unit 4B** — a 280 m2 ground-floor office in Almaty's Samal-2 business district (Zholdasbekov 97). Valued at $462,000 USD, leased to TechBridge Consulting LLP at $6,160/month, generating 11.2% annual net yield. Tokenized into 10,000 SBC4B tokens at $46.20 each.

6 KYC-verified investors and 1 unverified wallet demonstrate the compliance gating in action.

---

## Features

- **Full asset lifecycle** — create, issue, transfer, recall
- **On-chain KYC** — soulbound InvestorRecord PDAs (per-investor, per-asset)
- **Transfer Hook enforcement** — compliance checked on every transfer by the blockchain itself
- **Pro-rata yield distribution** — reward-per-token accumulator pattern (Synthetix model)
- **Immutable attestations** — document hash + URI stored on-chain with timestamp
- **Admin dashboard** — 5-step asset creation wizard, investor management, yield distribution, compliance recall
- **Investor dashboard** — holdings, yield claims, transfer history
- **i18n** — English, Russian, Kazakh
- **Theming** — Light / Dark / System
- **Docker Compose** — frontend + self-hosted IPFS node

---

## Design Decisions

**Transfer Hook is read-only by design.** Token-2022 passes all transfer accounts as read-only to hooks. We separate compliance checks (hook) from state mutations (core) to respect CPI depth limits.

**PermanentDelegate + Hook conflict resolution.** Regulatory recall via PermanentDelegate triggers the hook. Treasury wallets have `is_authority: true` in their InvestorRecord, allowing compliance-exempt administrative operations.

**DefaultAccountState(Frozen) is defense in depth.** Even if a token account is created through a third-party program or DEX, tokens cannot be received until explicitly KYC-approved. This layers on top of the transfer hook.

**DEX incompatibility is intentional.** Security tokens under AIFC STO Framework cannot trade on unregulated venues. The architecture enforces this at the protocol level.

**Yield uses eventual consistency.** The hook cannot atomically update yield state, so reward snapshots are updated before transfers via bundled instructions.

**Attestation uses admin attestation with IPFS hashes** — the same model used by Ondo and BlackRock BUIDL. In production, multi-party attestation via Squads multisig would replace single-admin.

**Token account owner resolution via AccountData seeds.** The hook reads the owner field directly from token account data (offset 32, 32 bytes), leveraging Token-2022's stable account layout.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Solana (Token-2022) |
| Smart Contracts | Anchor 0.32.1, Rust |
| Frontend | Next.js 14, React, TypeScript |
| UI | shadcn/ui, Tailwind CSS, framer-motion |
| Wallet | @solana/wallet-adapter (Phantom, Solflare) |
| Client SDK | @coral-xyz/anchor, @solana/web3.js, @solana/spl-token v0.4 |
| Deployment | Docker Compose (frontend + IPFS) |

---

## Project Structure

```
sandyq-sol/
├── programs/
│   ├── compliance-hook/src/    # Transfer hook + KYC registry
│   └── rwa-core/src/           # Asset mgmt, yield, attestation
├── app/                        # Next.js frontend
│   ├── app/                    # Pages (/, /dashboard, /admin, /assets/[id])
│   ├── components/             # Sidebar, header, providers, ui/
│   └── lib/                    # Constants, programs, hooks, IDL/
├── tests/sandyq-sol.ts         # 13 integration tests
├── target/idl/                 # Generated IDLs
├── docker-compose.yml          # Frontend + IPFS
└── Anchor.toml
```

---

## Hackathon

Built for **Decentrathon 5.0** — National Solana Hackathon, Kazakhstan

- **Case 1:** RWA Tokenization
- **Regulatory context:** AIFC STO Framework (effective January 2024), AFSA regulatory oversight, President Tokayev's digital asset law (January 2026)
- **Market context:** Kazakhstan's AIFC has 29 licensed providers. Apartchain (Jas Ventures) is tokenizing real estate on Solana in the National Bank sandbox. Sandyq provides the compliance infrastructure layer for the ecosystem.

---

## Team

**Arsen Abdigali** — Solo developer
