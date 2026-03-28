use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use crate::state::InvestorRecord;
use crate::errors::ComplianceError;

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: source token account, validated by token-2022
    pub source_token: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: destination token account, validated by token-2022
    pub destination_token: UncheckedAccount<'info>,

    /// CHECK: source authority/owner
    pub owner: UncheckedAccount<'info>,

    /// CHECK: ExtraAccountMetaList PDA
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(
        seeds = [b"investor", mint.key().as_ref(), sender_investor_record.wallet.as_ref()],
        bump = sender_investor_record.bump,
    )]
    pub sender_investor_record: Account<'info, InvestorRecord>,

    #[account(
        seeds = [b"investor", mint.key().as_ref(), receiver_investor_record.wallet.as_ref()],
        bump = receiver_investor_record.bump,
    )]
    pub receiver_investor_record: Account<'info, InvestorRecord>,
}

impl<'info> TransferHook<'info> {
    pub fn handle(&self) -> Result<()> {
        let sender = &self.sender_investor_record;
        let receiver = &self.receiver_investor_record;

        // if either party is an authority (e.g. treasury), allow unconditionally
        // this lets permanent delegate recalls work even when sender KYC is revoked
        if sender.is_authority || receiver.is_authority {
            return Ok(());
        }

        require!(sender.is_kyc, ComplianceError::SenderNotKycVerified);
        require!(receiver.is_kyc, ComplianceError::NotKycVerified);

        Ok(())
    }
}
