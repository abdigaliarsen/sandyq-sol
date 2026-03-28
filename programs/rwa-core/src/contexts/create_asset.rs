use anchor_lang::prelude::*;
use crate::state::AssetConfig;
use crate::constants::*;

#[derive(Accounts)]
pub struct CreateAsset<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + AssetConfig::INIT_SPACE,
        seeds = [ASSET_CONFIG_SEED, mint.key().as_ref()],
        bump,
    )]
    pub asset_config: Account<'info, AssetConfig>,

    /// CHECK: Mint account to be created externally
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
