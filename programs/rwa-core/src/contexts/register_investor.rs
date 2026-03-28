use anchor_lang::prelude::*;
use crate::state::AssetConfig;
use crate::constants::*;
use crate::errors::RwaError;

#[derive(Accounts)]
pub struct RegisterInvestor<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump = asset_config.bump,
        has_one = authority @ RwaError::Unauthorized,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    /// CHECK: InvestorRecord PDA on compliance-hook, created via CPI
    #[account(mut)]
    pub investor_record: UncheckedAccount<'info>,

    /// CHECK: wallet of the investor being registered
    pub wallet: UncheckedAccount<'info>,

    /// CHECK: mint for the asset
    pub mint: UncheckedAccount<'info>,

    /// CHECK: compliance hook program
    pub compliance_hook_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
