use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvestorRecord {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub is_kyc: bool,
    pub is_authority: bool,
    pub kyc_approved_at: Option<i64>,
    pub kyc_revoked_at: Option<i64>,
    pub created_at: i64,
    pub bump: u8,
}
