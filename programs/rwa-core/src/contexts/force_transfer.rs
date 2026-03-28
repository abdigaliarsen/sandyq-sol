use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::AssetConfig;
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
pub struct ForceTransfer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// source token account (investor being recalled from)
    #[account(
        mut,
        token::mint = mint,
    )]
    pub source: InterfaceAccount<'info, TokenAccount>,

    /// destination token account (treasury)
    #[account(
        mut,
        token::mint = mint,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: permanent delegate PDA
    #[account(
        seeds = [MINT_AUTHORITY_SEED, mint.key().as_ref()],
        bump,
    )]
    pub permanent_delegate: UncheckedAccount<'info>,

    /// CHECK: freeze authority PDA for thaw/re-freeze
    #[account(
        seeds = [FREEZE_AUTHORITY_SEED, mint.key().as_ref()],
        bump,
    )]
    pub freeze_authority: UncheckedAccount<'info>,

    /// CHECK: ExtraAccountMetaList for the transfer hook
    #[account(mut)]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// CHECK: sender investor record (for hook)
    pub sender_investor_record: UncheckedAccount<'info>,

    /// CHECK: receiver investor record (for hook, treasury)
    pub receiver_investor_record: UncheckedAccount<'info>,

    /// CHECK: compliance hook program
    pub compliance_hook_program: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}
