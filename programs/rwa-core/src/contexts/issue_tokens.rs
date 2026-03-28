use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::AssetConfig;
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
pub struct IssueTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    /// CHECK: InvestorRecord on compliance-hook -- deserialized manually
    pub investor_record: UncheckedAccount<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: mint authority PDA
    #[account(
        seeds = [MINT_AUTHORITY_SEED, mint.key().as_ref()],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}
