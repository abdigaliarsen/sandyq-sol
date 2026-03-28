use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::{AssetConfig, YieldVault};
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
pub struct DepositYield<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ASSET_CONFIG_SEED, rwa_mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + YieldVault::INIT_SPACE,
        seeds = [YIELD_VAULT_SEED, rwa_mint.key().as_ref()],
        bump,
    )]
    pub yield_vault: Account<'info, YieldVault>,

    /// CHECK: RWA mint
    pub rwa_mint: UncheckedAccount<'info>,

    /// reward token mint (e.g. USDC)
    pub reward_mint: InterfaceAccount<'info, Mint>,

    /// authority's reward token account (source)
    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = authority,
    )]
    pub authority_reward_account: InterfaceAccount<'info, TokenAccount>,

    /// vault's reward token account (destination)
    #[account(
        mut,
        token::mint = reward_mint,
    )]
    pub vault_reward_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
