use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::{InvestorYield, YieldVault};
use crate::constants::*;

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        seeds = [YIELD_VAULT_SEED, rwa_mint.key().as_ref()],
        bump = yield_vault.bump,
    )]
    pub yield_vault: Account<'info, YieldVault>,

    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + InvestorYield::INIT_SPACE,
        seeds = [INVESTOR_YIELD_SEED, rwa_mint.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub investor_yield: Account<'info, InvestorYield>,

    /// CHECK: RWA mint
    pub rwa_mint: UncheckedAccount<'info>,

    /// reward token mint (e.g. USDC)
    pub reward_mint: InterfaceAccount<'info, Mint>,

    /// investor's RWA token account -- read current balance
    #[account(
        token::mint = rwa_mint,
        token::authority = investor,
    )]
    pub investor_rwa_account: InterfaceAccount<'info, TokenAccount>,

    /// investor's reward token account (where yield goes)
    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = investor,
    )]
    pub investor_reward_account: InterfaceAccount<'info, TokenAccount>,

    /// vault's reward token account (source of yield)
    #[account(
        mut,
        token::mint = reward_mint,
    )]
    pub vault_reward_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
