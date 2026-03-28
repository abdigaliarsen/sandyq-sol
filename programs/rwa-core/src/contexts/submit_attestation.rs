use anchor_lang::prelude::*;
use crate::state::{AssetConfig, Attestation};
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
#[instruction(document_hash: [u8; 32])]
pub struct SubmitAttestation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Attestation::INIT_SPACE,
        seeds = [ATTESTATION_SEED, mint.key().as_ref(), document_hash.as_ref()],
        bump,
    )]
    pub attestation: Account<'info, Attestation>,

    /// CHECK: Mint for the asset
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
