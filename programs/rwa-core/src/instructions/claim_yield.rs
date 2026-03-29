use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use crate::contexts::ClaimYield;
use crate::constants::*;
use crate::errors::RwaError;

pub fn handler(ctx: Context<ClaimYield>) -> Result<()> {
    let vault = &ctx.accounts.yield_vault;
    let investor_yield = &mut ctx.accounts.investor_yield;

    // initialize if first time
    if investor_yield.mint == Pubkey::default() {
        investor_yield.wallet = ctx.accounts.investor.key();
        investor_yield.mint = ctx.accounts.rwa_mint.key();
        investor_yield.reward_per_token_paid = 0;
        investor_yield.rewards_earned = 0;
        investor_yield.last_claim_time = None;
        investor_yield.bump = ctx.bumps.investor_yield;
    }

    // read current RWA token balance
    let balance = ctx.accounts.investor_rwa_account.amount;

    // calculate pending rewards
    let pending = (balance as u128)
        .checked_mul(
            vault.reward_per_token_stored
                .checked_sub(investor_yield.reward_per_token_paid)
                .unwrap_or(0)
        )
        .ok_or(RwaError::ArithmeticOverflow)?
        .checked_div(PRECISION)
        .ok_or(RwaError::ArithmeticOverflow)? as u64;

    let total_reward = pending
        .checked_add(investor_yield.rewards_earned)
        .ok_or(RwaError::ArithmeticOverflow)?;

    require!(total_reward > 0, RwaError::NoYieldAvailable);

    // update investor snapshot
    investor_yield.reward_per_token_paid = vault.reward_per_token_stored;
    investor_yield.rewards_earned = 0;
    investor_yield.last_claim_time = Some(Clock::get()?.unix_timestamp);

    // transfer reward tokens from vault to investor
    let rwa_mint_key = ctx.accounts.rwa_mint.key();
    let seeds: &[&[u8]] = &[
        YIELD_VAULT_SEED,
        rwa_mint_key.as_ref(),
        &[vault.bump],
    ];

    let decimals = ctx.accounts.reward_mint.decimals;
    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_interface::TransferChecked {
                from: ctx.accounts.vault_reward_account.to_account_info(),
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.investor_reward_account.to_account_info(),
                authority: ctx.accounts.yield_vault.to_account_info(),
            },
            &[seeds],
        ),
        total_reward,
        decimals,
    )?;

    Ok(())
}
