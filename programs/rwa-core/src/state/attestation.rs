use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct Attestation {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub document_hash: [u8; 32],
    #[max_len(MAX_DOCUMENT_NAME_LEN)]
    pub document_name: String,
    #[max_len(MAX_DOCUMENT_URI_LEN)]
    pub document_uri: String,
    pub timestamp: i64,
    pub bump: u8,
}
