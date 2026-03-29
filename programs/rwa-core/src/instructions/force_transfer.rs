use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token_2022;
use crate::contexts::ForceTransfer;
use crate::constants::*;

pub fn handler(ctx: Context<ForceTransfer>, amount: u64) -> Result<()> {
    let was_frozen = ctx.accounts.source.is_frozen();
    let mint_key = ctx.accounts.mint.key();

    // thaw the source account first (it may be frozen after KYC revocation)
    if ctx.accounts.source.is_frozen() {
        let freeze_seeds: &[&[u8]] = &[
            FREEZE_AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.freeze_authority],
        ];

        token_2022::thaw_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::ThawAccount {
                    account: ctx.accounts.source.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.freeze_authority.to_account_info(),
                },
                &[freeze_seeds],
            ),
        )?;
    }

    let delegate_seeds: &[&[u8]] = &[
        MINT_AUTHORITY_SEED,
        mint_key.as_ref(),
        &[ctx.bumps.permanent_delegate],
    ];

    let decimals = ctx.accounts.mint.decimals;

    // build transfer_checked instruction with hook accounts
    let mut account_metas = vec![
        AccountMeta::new(ctx.accounts.source.key(), false),
        AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
        AccountMeta::new(ctx.accounts.destination.key(), false),
        AccountMeta::new_readonly(ctx.accounts.permanent_delegate.key(), true),
    ];

    // hook extra accounts
    account_metas.push(AccountMeta::new_readonly(ctx.accounts.extra_account_meta_list.key(), false));
    account_metas.push(AccountMeta::new_readonly(ctx.accounts.sender_investor_record.key(), false));
    account_metas.push(AccountMeta::new_readonly(ctx.accounts.receiver_investor_record.key(), false));
    account_metas.push(AccountMeta::new_readonly(ctx.accounts.compliance_hook_program.key(), false));

    // TransferChecked: discriminator(1) + amount(8) + decimals(1)
    let mut data = Vec::with_capacity(10);
    data.push(12u8);
    data.extend_from_slice(&amount.to_le_bytes());
    data.push(decimals);

    let ix = Instruction {
        program_id: ctx.accounts.token_program.key(),
        accounts: account_metas,
        data,
    };

    invoke_signed(
        &ix,
        &[
            ctx.accounts.source.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.destination.to_account_info(),
            ctx.accounts.permanent_delegate.to_account_info(),
            ctx.accounts.extra_account_meta_list.to_account_info(),
            ctx.accounts.sender_investor_record.to_account_info(),
            ctx.accounts.receiver_investor_record.to_account_info(),
            ctx.accounts.compliance_hook_program.to_account_info(),
        ],
        &[delegate_seeds],
    )?;

    // re-freeze the source account only if it was frozen before
    if was_frozen {
        let freeze_seeds: &[&[u8]] = &[
            FREEZE_AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.freeze_authority],
        ];

        token_2022::freeze_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::FreezeAccount {
                    account: ctx.accounts.source.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.freeze_authority.to_account_info(),
                },
                &[freeze_seeds],
            ),
        )?;
    }

    msg!("force transfer: {} tokens recalled", amount);

    Ok(())
}
