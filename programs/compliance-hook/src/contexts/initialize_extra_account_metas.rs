use anchor_lang::{
    prelude::*,
    system_program,
};
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta,
    seeds::Seed,
    state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList PDA, validated by seeds
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: authority that owns the asset
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeExtraAccountMetaList<'info> {
    pub fn handle(&self, bump: u8) -> Result<()> {
        let extra_account_metas = vec![
            // sender's InvestorRecord: ["investor", mint, source_token.owner]
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"investor".to_vec() },
                    Seed::AccountKey { index: 1 }, // mint
                    Seed::AccountData {
                        account_index: 0, // source token account
                        data_index: 32,   // owner field offset
                        length: 32,
                    },
                ],
                false, // is_signer
                false, // is_writable
            )?,
            // receiver's InvestorRecord: ["investor", mint, dest_token.owner]
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"investor".to_vec() },
                    Seed::AccountKey { index: 1 }, // mint
                    Seed::AccountData {
                        account_index: 2, // destination token account
                        data_index: 32,
                        length: 32,
                    },
                ],
                false,
                false,
            )?,
        ];

        let account_size = ExtraAccountMetaList::size_of(extra_account_metas.len())?;

        let lamports = Rent::get()?.minimum_balance(account_size);

        let mint_key = self.mint.key();
        let seeds: &[&[u8]] = &[
            b"extra-account-metas",
            mint_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[seeds];

        system_program::create_account(
            CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                system_program::CreateAccount {
                    from: self.payer.to_account_info(),
                    to: self.extra_account_meta_list.to_account_info(),
                },
                signer_seeds,
            ),
            lamports,
            account_size as u64,
            &crate::id(),
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut self.extra_account_meta_list.try_borrow_mut_data()?,
            &extra_account_metas,
        )?;

        Ok(())
    }
}
