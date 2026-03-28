/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/compliance_hook.json`.
 */
export type ComplianceHook = {
  "address": "D9yfcXGzFWLtyfKXapXxKcBFfDwGJfW7i717bM5YrnSh",
  "metadata": {
    "name": "complianceHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Token-2022 transfer hook for KYC enforcement"
  },
  "instructions": [
    {
      "name": "initializeExtraAccountMetaList",
      "discriminator": [
        92,
        197,
        174,
        197,
        41,
        124,
        19,
        3
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "registerInvestor",
      "discriminator": [
        95,
        16,
        66,
        212,
        152,
        123,
        136,
        173
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "investorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "wallet"
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "isAuthority",
          "type": "bool"
        }
      ]
    },
    {
      "name": "transferHook",
      "discriminator": [
        220,
        57,
        220,
        152,
        126,
        125,
        97,
        168
      ],
      "accounts": [
        {
          "name": "sourceToken"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationToken"
        },
        {
          "name": "owner"
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "senderInvestorRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sender_investor_record.wallet",
                "account": "investorRecord"
              }
            ]
          }
        },
        {
          "name": "receiverInvestorRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "receiver_investor_record.wallet",
                "account": "investorRecord"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateKycStatus",
      "discriminator": [
        182,
        90,
        72,
        162,
        173,
        39,
        52,
        147
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "investorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  101,
                  115,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "investor_record.wallet",
                "account": "investorRecord"
              }
            ]
          }
        },
        {
          "name": "mint"
        }
      ],
      "args": [
        {
          "name": "isKyc",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "investorRecord",
      "discriminator": [
        170,
        144,
        39,
        68,
        178,
        31,
        194,
        117
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Not authorized"
    },
    {
      "code": 6001,
      "name": "notKycVerified",
      "msg": "Recipient not KYC verified"
    },
    {
      "code": 6002,
      "name": "senderNotKycVerified",
      "msg": "Sender not KYC verified"
    },
    {
      "code": 6003,
      "name": "kycExpired",
      "msg": "KYC verification expired"
    },
    {
      "code": 6004,
      "name": "transferNotAllowed",
      "msg": "Transfer not allowed by compliance"
    }
  ],
  "types": [
    {
      "name": "investorRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "isKyc",
            "type": "bool"
          },
          {
            "name": "isAuthority",
            "type": "bool"
          },
          {
            "name": "kycApprovedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "kycRevokedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
