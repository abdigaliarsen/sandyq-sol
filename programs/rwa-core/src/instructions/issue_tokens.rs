use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use crate::contexts::IssueTokens;
use crate::constants::*;
use crate::errors::RwaError;

pub fn handler(ctx: Context<IssueTokens>, amount: u64) -> Result<()> {
    let config = &ctx.accounts.asset_config;

    require!(config.is_active, RwaError::AssetNotActive);

    require!(
        config.total_supply.checked_add(amount).ok_or(RwaError::MaxSupplyExceeded)? <= config.max_supply,
        RwaError::MaxSupplyExceeded
    );

    // independently check KYC by reading raw bytes from compliance-hook InvestorRecord
    // layout after 8-byte discriminator: wallet(32) + mint(32) + is_kyc(1) + is_authority(1) + ...
    let record_data = ctx.accounts.investor_record.try_borrow_data()?;
    require!(record_data.len() >= 8 + 32 + 32 + 1 + 1, RwaError::NotKycVerified);

    let wallet = Pubkey::try_from(&record_data[8..40]).unwrap();
    let mint_key = Pubkey::try_from(&record_data[40..72]).unwrap();
    let is_kyc = record_data[72] != 0;
    let is_authority = record_data[73] != 0;

    require!(is_kyc || is_authority, RwaError::NotKycVerified);
    require!(mint_key == ctx.accounts.mint.key(), RwaError::NotKycVerified);
    require!(wallet == ctx.accounts.destination.owner, RwaError::NotKycVerified);

    drop(record_data);

    // mint tokens
    let mint_pubkey = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[
        MINT_AUTHORITY_SEED,
        mint_pubkey.as_ref(),
        &[ctx.bumps.mint_authority],
    ];

    token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;

    let config = &mut ctx.accounts.asset_config;
    config.total_supply = config.total_supply.checked_add(amount).unwrap();

    Ok(())
}
