use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke;
use crate::contexts::RegisterInvestor;

// sha256("global:register_investor")[..8]
const REGISTER_INVESTOR_DISC: [u8; 8] = [95, 16, 66, 212, 152, 123, 136, 173];

pub fn handler(ctx: Context<RegisterInvestor>) -> Result<()> {
    let mut data = Vec::with_capacity(9);
    data.extend_from_slice(&REGISTER_INVESTOR_DISC);
    data.push(0u8); // is_authority = false

    let ix = Instruction {
        program_id: ctx.accounts.compliance_hook_program.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.authority.key(), true),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
            AccountMeta::new(ctx.accounts.investor_record.key(), false),
            AccountMeta::new_readonly(ctx.accounts.wallet.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ],
        data,
    };

    invoke(
        &ix,
        &[
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.investor_record.to_account_info(),
            ctx.accounts.wallet.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.compliance_hook_program.to_account_info(),
        ],
    )?;

    Ok(())
}
