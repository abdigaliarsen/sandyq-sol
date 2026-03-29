use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::AssetConfig;
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
pub struct ApproveKyc<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    /// CHECK: InvestorRecord PDA on compliance-hook
    #[account(mut)]
    pub investor_record: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// investor's token account to thaw
    #[account(
        mut,
        token::mint = mint,
    )]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: freeze authority PDA
    #[account(
        seeds = [FREEZE_AUTHORITY_SEED, mint.key().as_ref()],
        bump,
    )]
    pub freeze_authority: UncheckedAccount<'info>,

    /// CHECK: compliance hook program, validated by address
    #[account(address = COMPLIANCE_HOOK_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub compliance_hook_program: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}
