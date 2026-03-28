use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod errors;
pub mod instructions;
pub mod state;

use contexts::*;

declare_id!("9ZQBB6PWDiBeHbhKZBEyC5wr6C23ohFwrMAw3ugstG8A");

#[program]
pub mod rwa_core {
    use super::*;

    pub fn create_asset(
        ctx: Context<CreateAsset>,
        name: String,
        symbol: String,
        asset_type: String,
        jurisdiction: String,
        max_supply: u64,
        valuation_usd: u64,
    ) -> Result<()> {
        instructions::create_asset::handler(ctx, name, symbol, asset_type, jurisdiction, max_supply, valuation_usd)
    }

    pub fn register_investor(ctx: Context<RegisterInvestor>) -> Result<()> {
        instructions::register_investor::handler(ctx)
    }

    pub fn approve_kyc(ctx: Context<ApproveKyc>) -> Result<()> {
        instructions::approve_kyc::handler(ctx)
    }

    pub fn revoke_kyc(ctx: Context<RevokeKyc>) -> Result<()> {
        instructions::revoke_kyc::handler(ctx)
    }

    pub fn issue_tokens(ctx: Context<IssueTokens>, amount: u64) -> Result<()> {
        instructions::issue_tokens::handler(ctx, amount)
    }

    pub fn force_transfer(ctx: Context<ForceTransfer>, amount: u64) -> Result<()> {
        instructions::force_transfer::handler(ctx, amount)
    }

    pub fn deposit_yield(ctx: Context<DepositYield>, amount: u64) -> Result<()> {
        instructions::deposit_yield::handler(ctx, amount)
    }

    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        instructions::claim_yield::handler(ctx)
    }

    pub fn submit_attestation(
        ctx: Context<SubmitAttestation>,
        document_hash: [u8; 32],
        document_name: String,
        document_uri: String,
    ) -> Result<()> {
        instructions::submit_attestation::handler(ctx, document_hash, document_name, document_uri)
    }
}
