use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use crate::contexts::DepositYield;
use crate::constants::*;
use crate::errors::RwaError;

pub fn handler(ctx: Context<DepositYield>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.yield_vault;
    let config = &ctx.accounts.asset_config;

    // initialize vault if first time
    if vault.mint == Pubkey::default() {
        vault.mint = ctx.accounts.rwa_mint.key();
        vault.authority = ctx.accounts.authority.key();
        vault.reward_per_token_stored = 0;
        vault.total_deposited = 0;
        vault.last_update_time = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.yield_vault;
    }

    require!(config.total_supply > 0, RwaError::ZeroSupply);

    // update reward_per_token
    let reward_increment = (amount as u128)
        .checked_mul(PRECISION)
        .ok_or(RwaError::ArithmeticOverflow)?
        .checked_div(config.total_supply as u128)
        .ok_or(RwaError::ArithmeticOverflow)?;

    vault.reward_per_token_stored = vault.reward_per_token_stored
        .checked_add(reward_increment)
        .ok_or(RwaError::ArithmeticOverflow)?;
    vault.total_deposited = vault.total_deposited.checked_add(amount).ok_or(RwaError::ArithmeticOverflow)?;
    vault.last_update_time = Clock::get()?.unix_timestamp;

    // transfer reward tokens from authority to vault
    let decimals = ctx.accounts.reward_mint.decimals;
    token_interface::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_interface::TransferChecked {
                from: ctx.accounts.authority_reward_account.to_account_info(),
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.vault_reward_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
        decimals,
    )?;

    Ok(())
}
