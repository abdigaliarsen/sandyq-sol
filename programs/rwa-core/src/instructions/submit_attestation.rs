use anchor_lang::prelude::*;
use crate::contexts::SubmitAttestation;

pub fn handler(
    ctx: Context<SubmitAttestation>,
    document_hash: [u8; 32],
    document_name: String,
    document_uri: String,
) -> Result<()> {
    let att = &mut ctx.accounts.attestation;
    att.mint = ctx.accounts.mint.key();
    att.authority = ctx.accounts.authority.key();
    att.document_hash = document_hash;
    att.document_name = document_name;
    att.document_uri = document_uri;
    att.timestamp = Clock::get()?.unix_timestamp;
    att.bump = ctx.bumps.attestation;

    let config = &mut ctx.accounts.asset_config;
    config.attestation_count = config.attestation_count.checked_add(1).unwrap();

    Ok(())
}
