use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct AssetConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub max_supply: u64,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String,
    #[max_len(MAX_ASSET_TYPE_LEN)]
    pub asset_type: String,
    #[max_len(MAX_JURISDICTION_LEN)]
    pub jurisdiction: String,
    pub valuation_usd: u64,
    pub is_active: bool,
    pub attestation_count: u32,
    pub created_at: i64,
    pub bump: u8,
}
