use anchor_lang::prelude::*;
use crate::contexts::CreateAsset;

pub fn handler(
    ctx: Context<CreateAsset>,
    name: String,
    symbol: String,
    asset_type: String,
    jurisdiction: String,
    max_supply: u64,
    valuation_usd: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.asset_config;
    config.authority = ctx.accounts.authority.key();
    config.mint = ctx.accounts.mint.key();
    config.name = name;
    config.symbol = symbol;
    config.asset_type = asset_type;
    config.jurisdiction = jurisdiction;
    config.max_supply = max_supply;
    config.total_supply = 0;
    config.valuation_usd = valuation_usd;
    config.is_active = true;
    config.attestation_count = 0;
    config.created_at = Clock::get()?.unix_timestamp;
    config.bump = ctx.bumps.asset_config;
    Ok(())
}
