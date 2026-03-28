use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct YieldVault {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub reward_per_token_stored: u128,
    pub total_deposited: u64,
    pub last_update_time: i64,
    pub bump: u8,
}
