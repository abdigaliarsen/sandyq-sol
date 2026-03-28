use anchor_lang::prelude::*;
use crate::state::InvestorRecord;

#[derive(Accounts)]
pub struct RegisterInvestorHook<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + InvestorRecord::INIT_SPACE,
        seeds = [b"investor", mint.key().as_ref(), wallet.key().as_ref()],
        bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    /// CHECK: wallet of the investor being registered
    pub wallet: UncheckedAccount<'info>,

    /// CHECK: mint for the asset
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> RegisterInvestorHook<'info> {
    pub fn handle(&mut self, is_authority: bool, bump: u8) -> Result<()> {
        let record = &mut self.investor_record;
        record.wallet = self.wallet.key();
        record.mint = self.mint.key();
        record.is_kyc = false;
        record.is_authority = is_authority;
        record.kyc_approved_at = None;
        record.kyc_revoked_at = None;
        record.created_at = Clock::get()?.unix_timestamp;
        record.bump = bump;
        Ok(())
    }
}
