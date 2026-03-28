use anchor_lang::prelude::*;

pub mod contexts;
pub mod errors;
pub mod state;

use contexts::*;

declare_id!("D9yfcXGzFWLtyfKXapXxKcBFfDwGJfW7i717bM5YrnSh");

#[program]
pub mod compliance_hook {
    use super::*;

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        ctx.accounts.handle(ctx.bumps.extra_account_meta_list)
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, _amount: u64) -> Result<()> {
        ctx.accounts.handle()
    }

    pub fn register_investor(
        ctx: Context<RegisterInvestorHook>,
        is_authority: bool,
    ) -> Result<()> {
        ctx.accounts.handle(is_authority, ctx.bumps.investor_record)
    }

    pub fn update_kyc_status(
        ctx: Context<UpdateKycStatus>,
        is_kyc: bool,
    ) -> Result<()> {
        ctx.accounts.handle(is_kyc)
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction =
            spl_transfer_hook_interface::instruction::TransferHookInstruction::unpack(data)?;

        match instruction {
            spl_transfer_hook_interface::instruction::TransferHookInstruction::Execute {
                ..
            } => {
                __private::__global::transfer_hook(program_id, accounts, data)
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}
