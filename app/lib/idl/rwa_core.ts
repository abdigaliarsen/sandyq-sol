/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rwa_core.json`.
 */
export type RwaCore = {
  "address": "9ZQBB6PWDiBeHbhKZBEyC5wr6C23ohFwrMAw3ugstG8A",
  "metadata": {
    "name": "rwaCore",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "RWA tokenization core program"
  },
  "instructions": [
    {
      "name": "approveKyc",
      "discriminator": [
        11,
        216,
        190,
        26,
        72,
        228,
        211,
        85
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "investorRecord",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "investor's token account to thaw"
          ],
          "writable": true
        },
        {
          "name": "freezeAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  101,
                  101,
                  122,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "complianceHookProgram"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "claimYield",
      "discriminator": [
        49,
        74,
        111,
        7,
        186,
        22,
        61,
        165
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "yieldVault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "rwaMint"
              }
            ]
          }
        },
        {
          "name": "investorYield",
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
                  114,
                  95,
                  121,
                  105,
                  101,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "rwaMint"
              },
              {
                "kind": "account",
                "path": "investor"
              }
            ]
          }
        },
        {
          "name": "rwaMint"
        },
        {
          "name": "rewardMint",
          "docs": [
            "reward token mint (e.g. USDC)"
          ]
        },
        {
          "name": "investorRwaAccount",
          "docs": [
            "investor's RWA token account -- read current balance"
          ]
        },
        {
          "name": "investorRewardAccount",
          "docs": [
            "investor's reward token account (where yield goes)"
          ],
          "writable": true
        },
        {
          "name": "vaultRewardAccount",
          "docs": [
            "vault's reward token account (source of yield)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createAsset",
      "discriminator": [
        28,
        42,
        120,
        51,
        7,
        38,
        156,
        136
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "assetConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "assetType",
          "type": "string"
        },
        {
          "name": "jurisdiction",
          "type": "string"
        },
        {
          "name": "maxSupply",
          "type": "u64"
        },
        {
          "name": "valuationUsd",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositYield",
      "discriminator": [
        204,
        126,
        164,
        36,
        57,
        174,
        68,
        139
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "rwaMint"
              }
            ]
          }
        },
        {
          "name": "yieldVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "rwaMint"
              }
            ]
          }
        },
        {
          "name": "rwaMint"
        },
        {
          "name": "rewardMint",
          "docs": [
            "reward token mint (e.g. USDC)"
          ]
        },
        {
          "name": "authorityRewardAccount",
          "docs": [
            "authority's reward token account (source)"
          ],
          "writable": true
        },
        {
          "name": "vaultRewardAccount",
          "docs": [
            "vault's reward token account (destination)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "name": "forceTransfer",
      "discriminator": [
        179,
        38,
        130,
        121,
        202,
        8,
        199,
        21
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "mint",
          "writable": true
        },
        {
          "name": "source",
          "docs": [
            "source token account (investor being recalled from)"
          ],
          "writable": true
        },
        {
          "name": "destination",
          "docs": [
            "destination token account (treasury)"
          ],
          "writable": true
        },
        {
          "name": "permanentDelegate",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "freezeAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  101,
                  101,
                  122,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "extraAccountMetaList",
          "writable": true
        },
        {
          "name": "senderInvestorRecord"
        },
        {
          "name": "receiverInvestorRecord"
        },
        {
          "name": "complianceHookProgram"
        },
        {
          "name": "tokenProgram"
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
      "name": "issueTokens",
      "discriminator": [
        40,
        207,
        145,
        106,
        249,
        54,
        23,
        179
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "investorRecord"
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "tokenProgram"
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
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "investorRecord",
          "writable": true
        },
        {
          "name": "wallet"
        },
        {
          "name": "mint"
        },
        {
          "name": "complianceHookProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revokeKyc",
      "discriminator": [
        170,
        100,
        20,
        190,
        192,
        242,
        236,
        232
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "investorRecord",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "investor's token account to freeze"
          ],
          "writable": true
        },
        {
          "name": "freezeAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  101,
                  101,
                  122,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "complianceHookProgram"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "submitAttestation",
      "discriminator": [
        238,
        220,
        255,
        105,
        183,
        211,
        40,
        83
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "assetConfig"
          ]
        },
        {
          "name": "assetConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  116,
                  116,
                  101,
                  115,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "documentHash"
              }
            ]
          }
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
          "name": "documentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "documentName",
          "type": "string"
        },
        {
          "name": "documentUri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "assetConfig",
      "discriminator": [
        57,
        112,
        247,
        166,
        247,
        64,
        140,
        23
      ]
    },
    {
      "name": "attestation",
      "discriminator": [
        152,
        125,
        183,
        86,
        36,
        146,
        121,
        73
      ]
    },
    {
      "name": "investorYield",
      "discriminator": [
        101,
        144,
        117,
        210,
        7,
        215,
        68,
        225
      ]
    },
    {
      "name": "yieldVault",
      "discriminator": [
        17,
        229,
        96,
        254,
        254,
        179,
        195,
        163
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
      "name": "alreadyKycApproved",
      "msg": "Already KYC approved"
    },
    {
      "code": 6005,
      "name": "alreadyKycRevoked",
      "msg": "Already KYC revoked"
    },
    {
      "code": 6006,
      "name": "assetNotActive",
      "msg": "Asset is not active"
    },
    {
      "code": 6007,
      "name": "maxSupplyExceeded",
      "msg": "Max supply exceeded"
    },
    {
      "code": 6008,
      "name": "insufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6009,
      "name": "noYieldAvailable",
      "msg": "No yield available to claim"
    },
    {
      "code": 6010,
      "name": "zeroSupply",
      "msg": "Cannot deposit yield with zero supply"
    },
    {
      "code": 6011,
      "name": "invalidDocumentHash",
      "msg": "Invalid document hash"
    },
    {
      "code": 6012,
      "name": "transferNotAllowed",
      "msg": "Transfer not allowed by compliance"
    },
    {
      "code": 6013,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "assetConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "maxSupply",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "assetType",
            "type": "string"
          },
          {
            "name": "jurisdiction",
            "type": "string"
          },
          {
            "name": "valuationUsd",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "attestationCount",
            "type": "u32"
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
    },
    {
      "name": "attestation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "documentHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "documentName",
            "type": "string"
          },
          {
            "name": "documentUri",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "investorYield",
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
            "name": "rewardPerTokenPaid",
            "type": "u128"
          },
          {
            "name": "rewardsEarned",
            "type": "u64"
          },
          {
            "name": "lastClaimTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "yieldVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "rewardPerTokenStored",
            "type": "u128"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "lastUpdateTime",
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
