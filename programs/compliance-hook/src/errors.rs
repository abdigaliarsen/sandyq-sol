use anchor_lang::prelude::*;

#[error_code]
pub enum ComplianceError {
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Recipient not KYC verified")]
    NotKycVerified,
    #[msg("Sender not KYC verified")]
    SenderNotKycVerified,
    #[msg("KYC verification expired")]
    KycExpired,
    #[msg("Transfer not allowed by compliance")]
    TransferNotAllowed,
}
