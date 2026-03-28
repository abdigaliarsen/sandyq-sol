use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token_2022;
use crate::contexts::RevokeKyc;
use crate::constants::*;

// sha256("global:update_kyc_status")[..8]
const UPDATE_KYC_STATUS_DISC: [u8; 8] = [182, 90, 72, 162, 173, 39, 52, 147];

pub fn handler(ctx: Context<RevokeKyc>) -> Result<()> {
    // CPI to compliance-hook::update_kyc_status(is_kyc=false)
    let mut data = Vec::with_capacity(9);
    data.extend_from_slice(&UPDATE_KYC_STATUS_DISC);
    data.push(0u8); // is_kyc = false

    let ix = Instruction {
        program_id: ctx.accounts.compliance_hook_program.key(),
        accounts: vec![
            AccountMeta::new_readonly(ctx.accounts.authority.key(), true),
            AccountMeta::new(ctx.accounts.investor_record.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
        ],
        data,
    };

    invoke(
        &ix,
        &[
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.investor_record.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.compliance_hook_program.to_account_info(),
        ],
    )?;

    // freeze the investor's token account
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[
        FREEZE_AUTHORITY_SEED,
        mint_key.as_ref(),
        &[ctx.bumps.freeze_authority],
    ];

    token_2022::freeze_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_2022::FreezeAccount {
                account: ctx.accounts.investor_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.freeze_authority.to_account_info(),
            },
            &[seeds],
        ),
    )?;

    Ok(())
}
