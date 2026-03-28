use anchor_lang::prelude::*;

#[error_code]
pub enum RwaError {
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Recipient not KYC verified")]
    NotKycVerified,
    #[msg("Sender not KYC verified")]
    SenderNotKycVerified,
    #[msg("KYC verification expired")]
    KycExpired,
    #[msg("Already KYC approved")]
    AlreadyKycApproved,
    #[msg("Already KYC revoked")]
    AlreadyKycRevoked,
    #[msg("Asset is not active")]
    AssetNotActive,
    #[msg("Max supply exceeded")]
    MaxSupplyExceeded,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("No yield available to claim")]
    NoYieldAvailable,
    #[msg("Cannot deposit yield with zero supply")]
    ZeroSupply,
    #[msg("Invalid document hash")]
    InvalidDocumentHash,
    #[msg("Transfer not allowed by compliance")]
    TransferNotAllowed,
}
