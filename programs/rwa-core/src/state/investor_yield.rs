use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvestorYield {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub reward_per_token_paid: u128,
    pub rewards_earned: u64,
    pub last_claim_time: Option<i64>,
    pub bump: u8,
}
