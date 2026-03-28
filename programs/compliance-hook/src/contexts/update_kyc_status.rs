use anchor_lang::prelude::*;
use crate::state::InvestorRecord;

#[derive(Accounts)]
pub struct UpdateKycStatus<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"investor", mint.key().as_ref(), investor_record.wallet.as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    /// CHECK: mint for the asset
    pub mint: UncheckedAccount<'info>,
}

impl<'info> UpdateKycStatus<'info> {
    pub fn handle(&mut self, is_kyc: bool) -> Result<()> {
        let record = &mut self.investor_record;
        let now = Clock::get()?.unix_timestamp;

        record.is_kyc = is_kyc;

        if is_kyc {
            record.kyc_approved_at = Some(now);
        } else {
            record.kyc_revoked_at = Some(now);
        }

        Ok(())
    }
}
