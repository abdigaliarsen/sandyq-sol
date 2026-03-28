import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ComplianceHook } from "../target/types/compliance_hook";
import { RwaCore } from "../target/types/rwa_core";
import { expect } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializeMetadataPointerInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  addExtraAccountMetasForExecute,
  AccountState,
  createSetAuthorityInstruction,
  AuthorityType,
  getAccount,
  getMint,
  createInitializeMint2Instruction,
} from "@solana/spl-token";
import {
  createInitializeInstruction as createInitializeMetadataInstruction,
  pack,
} from "@solana/spl-token-metadata";

describe("sandyq-sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const hookProgram = anchor.workspace.ComplianceHook as Program<ComplianceHook>;
  const coreProgram = anchor.workspace.RwaCore as Program<RwaCore>;
  const connection = provider.connection;
  const authority = provider.wallet as anchor.Wallet;

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const decimals = 6;

  const investor1 = Keypair.generate();
  const investor2 = Keypair.generate();
  const stranger = Keypair.generate();

  // PDAs
  let freezeAuthorityPda: PublicKey;
  let mintAuthorityPda: PublicKey;
  let assetConfigPda: PublicKey;
  let extraAccountMetaListPda: PublicKey;

  let treasuryAta: PublicKey;
  let investor1Ata: PublicKey;
  let investor2Ata: PublicKey;
  let strangerAta: PublicKey;

  // reward mint
  const rewardMintKeypair = Keypair.generate();
  const rewardMint = rewardMintKeypair.publicKey;

  before(async () => {
    [freezeAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("freeze_authority"), mint.toBuffer()],
      coreProgram.programId
    );
    [mintAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), mint.toBuffer()],
      coreProgram.programId
    );
    [assetConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset_config"), mint.toBuffer()],
      coreProgram.programId
    );
    [extraAccountMetaListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("extra-account-metas"), mint.toBuffer()],
      hookProgram.programId
    );

    treasuryAta = getAssociatedTokenAddressSync(
      mint, authority.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    investor1Ata = getAssociatedTokenAddressSync(
      mint, investor1.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    investor2Ata = getAssociatedTokenAddressSync(
      mint, investor2.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    strangerAta = getAssociatedTokenAddressSync(
      mint, stranger.publicKey, false, TOKEN_2022_PROGRAM_ID
    );

    for (const kp of [investor1, investor2, stranger]) {
      const sig = await connection.requestAirdrop(kp.publicKey, 2e9);
      await connection.confirmTransaction(sig);
    }
  });

  it("creates token-2022 mint with extensions", async () => {
    // space: base extensions only (no metadata for now)
    const extensions = [
      ExtensionType.TransferHook,
      ExtensionType.PermanentDelegate,
      ExtensionType.DefaultAccountState,
    ];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const tx1 = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferHookInstruction(
        mint,
        authority.publicKey,
        hookProgram.programId,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializePermanentDelegateInstruction(
        mint,
        mintAuthorityPda,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeDefaultAccountStateInstruction(
        mint,
        AccountState.Frozen,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMint2Instruction(
        mint,
        decimals,
        authority.publicKey,
        freezeAuthorityPda,
        TOKEN_2022_PROGRAM_ID
      ),
    );

    await sendAndConfirmTransaction(connection, tx1, [authority.payer, mintKeypair]);

    // transfer mint authority to the PDA
    const tx2 = new Transaction().add(
      createSetAuthorityInstruction(
        mint,
        authority.publicKey,
        AuthorityType.MintTokens,
        mintAuthorityPda,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx2, [authority.payer]);

    const mintInfo = await getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
    expect(mintInfo.mintAuthority.toBase58()).to.equal(mintAuthorityPda.toBase58());
    expect(mintInfo.freezeAuthority.toBase58()).to.equal(freezeAuthorityPda.toBase58());
  });

  it("creates asset config", async () => {
    await coreProgram.methods
      .createAsset(
        "Almaty Business Center",
        "ABC",
        "real_estate",
        "KZ-AIFC",
        new anchor.BN(25_000_000_000),
        new anchor.BN(250_000_00)
      )
      .accounts({
        authority: authority.publicKey,
        mint: mint,
      })
      .rpc();

    const config = await coreProgram.account.assetConfig.fetch(assetConfigPda);
    expect(config.name).to.equal("Almaty Business Center");
    expect(config.isActive).to.be.true;
  });

  it("initializes extra account meta list", async () => {
    await hookProgram.methods
      .initializeExtraAccountMetaList()
      .accounts({
        payer: authority.publicKey,
        mint: mint,
        authority: authority.publicKey,
      })
      .rpc();
  });

  it("registers treasury with is_authority=true and thaws", async () => {
    const [treasuryRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), authority.publicKey.toBuffer()],
      hookProgram.programId
    );

    // register
    await hookProgram.methods
      .registerInvestor(true)
      .accounts({
        payer: authority.publicKey,
        authority: authority.publicKey,
        wallet: authority.publicKey,
        mint: mint,
      })
      .rpc();

    // create treasury ATA
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        treasuryAta,
        authority.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx, [authority.payer]);

    // approve KYC (sets is_kyc=true + thaws)
    await coreProgram.methods
      .approveKyc()
      .accounts({
        authority: authority.publicKey,
        mint: mint,
        investorRecord: treasuryRecord,
        investorTokenAccount: treasuryAta,
        complianceHookProgram: hookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const record = await hookProgram.account.investorRecord.fetch(treasuryRecord);
    expect(record.isAuthority).to.be.true;
    expect(record.isKyc).to.be.true;
  });

  it("registers investor1 and approves KYC", async () => {
    const [investorRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), investor1.publicKey.toBuffer()],
      hookProgram.programId
    );

    await hookProgram.methods
      .registerInvestor(false)
      .accounts({
        payer: authority.publicKey,
        authority: authority.publicKey,
        wallet: investor1.publicKey,
        mint: mint,
      })
      .rpc();

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        investor1Ata,
        investor1.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx, [authority.payer]);

    await coreProgram.methods
      .approveKyc()
      .accounts({
        authority: authority.publicKey,
        mint: mint,
        investorRecord: investorRecord,
        investorTokenAccount: investor1Ata,
        complianceHookProgram: hookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const record = await hookProgram.account.investorRecord.fetch(investorRecord);
    expect(record.isKyc).to.be.true;
  });

  it("registers investor2 and approves KYC", async () => {
    const [investorRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), investor2.publicKey.toBuffer()],
      hookProgram.programId
    );

    await hookProgram.methods
      .registerInvestor(false)
      .accounts({
        payer: authority.publicKey,
        authority: authority.publicKey,
        wallet: investor2.publicKey,
        mint: mint,
      })
      .rpc();

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        investor2Ata,
        investor2.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx, [authority.payer]);

    await coreProgram.methods
      .approveKyc()
      .accounts({
        authority: authority.publicKey,
        mint: mint,
        investorRecord: investorRecord,
        investorTokenAccount: investor2Ata,
        complianceHookProgram: hookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
  });

  it("issues tokens to investor1", async () => {
    const [investorRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), investor1.publicKey.toBuffer()],
      hookProgram.programId
    );

    await coreProgram.methods
      .issueTokens(new anchor.BN(1_000_000_000))
      .accounts({
        authority: authority.publicKey,
        investorRecord: investorRecord,
        mint: mint,
        destination: investor1Ata,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const account = await getAccount(connection, investor1Ata, undefined, TOKEN_2022_PROGRAM_ID);
    expect(Number(account.amount)).to.equal(1_000_000_000);
  });

  it("transfers tokens investor1 -> investor2 (both KYC'd)", async () => {
    const amount = 100_000_000;

    const transferIx = createTransferCheckedInstruction(
      investor1Ata,
      mint,
      investor2Ata,
      investor1.publicKey,
      amount,
      decimals,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    await addExtraAccountMetasForExecute(
      connection,
      transferIx,
      hookProgram.programId,
      investor1Ata,
      mint,
      investor2Ata,
      investor1.publicKey,
      amount,
    );

    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      transferIx
    );

    await sendAndConfirmTransaction(connection, tx, [investor1]);

    const account1 = await getAccount(connection, investor1Ata, undefined, TOKEN_2022_PROGRAM_ID);
    const account2 = await getAccount(connection, investor2Ata, undefined, TOKEN_2022_PROGRAM_ID);
    expect(Number(account1.amount)).to.equal(900_000_000);
    expect(Number(account2.amount)).to.equal(100_000_000);
  });

  it("blocks transfer to non-KYC'd stranger", async () => {
    // register but don't approve KYC
    await hookProgram.methods
      .registerInvestor(false)
      .accounts({
        payer: authority.publicKey,
        authority: authority.publicKey,
        wallet: stranger.publicKey,
        mint: mint,
      })
      .rpc();

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        strangerAta,
        stranger.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, tx, [authority.payer]);

    const amount = 10_000_000;
    const transferIx = createTransferCheckedInstruction(
      investor1Ata,
      mint,
      strangerAta,
      investor1.publicKey,
      amount,
      decimals,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    await addExtraAccountMetasForExecute(
      connection,
      transferIx,
      hookProgram.programId,
      investor1Ata,
      mint,
      strangerAta,
      investor1.publicKey,
      amount,
    );

    const transferTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      transferIx
    );

    try {
      await sendAndConfirmTransaction(connection, transferTx, [investor1]);
      expect.fail("should have failed");
    } catch (err) {
      expect(err).to.exist;
    }
  });

  it("submits attestation", async () => {
    const documentHash = Buffer.alloc(32);
    documentHash.write("almaty_deed_v1", 0);

    await coreProgram.methods
      .submitAttestation(
        Array.from(documentHash),
        "Property Deed",
        "https://ipfs.io/ipfs/QmFakeHash"
      )
      .accounts({
        authority: authority.publicKey,
        mint: mint,
      })
      .rpc();

    const config = await coreProgram.account.assetConfig.fetch(assetConfigPda);
    expect(config.attestationCount).to.equal(1);
  });

  it("deposits and claims yield", async () => {
    // create reward mint
    const rewardMintLen = getMintLen([]);
    const rewardLamports = await connection.getMinimumBalanceForRentExemption(rewardMintLen);
    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: rewardMint,
        space: rewardMintLen,
        lamports: rewardLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        rewardMint, 6, authority.publicKey, null, TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, createMintTx, [authority.payer, rewardMintKeypair]);

    // create authority reward ATA
    const authorityRewardAta = getAssociatedTokenAddressSync(
      rewardMint, authority.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    let ataTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey, authorityRewardAta, authority.publicKey,
        rewardMint, TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, ataTx, [authority.payer]);

    // mint reward tokens
    const { createMintToInstruction } = await import("@solana/spl-token");
    const mintRewardTx = new Transaction().add(
      createMintToInstruction(
        rewardMint, authorityRewardAta, authority.publicKey,
        100_000_000, [], TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, mintRewardTx, [authority.payer]);

    // create vault reward ATA
    const [yieldVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("yield_vault"), mint.toBuffer()], coreProgram.programId
    );
    const vaultRewardAta = getAssociatedTokenAddressSync(
      rewardMint, yieldVaultPda, true, TOKEN_2022_PROGRAM_ID
    );
    ataTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey, vaultRewardAta, yieldVaultPda,
        rewardMint, TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, ataTx, [authority.payer]);

    // deposit yield
    await coreProgram.methods
      .depositYield(new anchor.BN(10_000_000))
      .accounts({
        authority: authority.publicKey,
        rwaMint: mint,
        rewardMint: rewardMint,
        authorityRewardAccount: authorityRewardAta,
        vaultRewardAccount: vaultRewardAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const vault = await coreProgram.account.yieldVault.fetch(yieldVaultPda);
    expect(vault.totalDeposited.toNumber()).to.equal(10_000_000);

    // create investor1 reward ATA
    const investor1RewardAta = getAssociatedTokenAddressSync(
      rewardMint, investor1.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    ataTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey, investor1RewardAta, investor1.publicKey,
        rewardMint, TOKEN_2022_PROGRAM_ID
      )
    );
    await sendAndConfirmTransaction(connection, ataTx, [authority.payer]);

    // claim yield
    await coreProgram.methods
      .claimYield()
      .accounts({
        investor: investor1.publicKey,
        rwaMint: mint,
        rewardMint: rewardMint,
        investorRwaAccount: investor1Ata,
        investorRewardAccount: investor1RewardAta,
        vaultRewardAccount: vaultRewardAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([investor1])
      .rpc();

    const rewardAccount = await getAccount(
      connection, investor1RewardAta, undefined, TOKEN_2022_PROGRAM_ID
    );
    // investor1 has 900/1000 tokens = 90% of 10 USDC = 9 USDC
    expect(Number(rewardAccount.amount)).to.equal(9_000_000);
  });

  it("revokes KYC and blocks transfer", async () => {
    const [investorRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), investor1.publicKey.toBuffer()],
      hookProgram.programId
    );

    await coreProgram.methods
      .revokeKyc()
      .accounts({
        authority: authority.publicKey,
        mint: mint,
        investorRecord: investorRecord,
        investorTokenAccount: investor1Ata,
        complianceHookProgram: hookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();

    const record = await hookProgram.account.investorRecord.fetch(investorRecord);
    expect(record.isKyc).to.be.false;

    // transfer from frozen/revoked investor should fail
    const amount = 10_000_000;
    const transferIx = createTransferCheckedInstruction(
      investor1Ata, mint, investor2Ata, investor1.publicKey,
      amount, decimals, [], TOKEN_2022_PROGRAM_ID
    );

    await addExtraAccountMetasForExecute(
      connection, transferIx, hookProgram.programId,
      investor1Ata, mint, investor2Ata, investor1.publicKey, amount
    );

    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      transferIx
    );

    try {
      await sendAndConfirmTransaction(connection, tx, [investor1]);
      expect.fail("should have failed");
    } catch (err) {
      expect(err).to.exist;
    }
  });

  it("force transfers tokens from revoked investor to treasury", async () => {
    const [senderRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), investor1.publicKey.toBuffer()],
      hookProgram.programId
    );
    const [receiverRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), mint.toBuffer(), authority.publicKey.toBuffer()],
      hookProgram.programId
    );

    const beforeAccount = await getAccount(
      connection, investor1Ata, undefined, TOKEN_2022_PROGRAM_ID
    );
    const recallAmount = Number(beforeAccount.amount);

    await coreProgram.methods
      .forceTransfer(new anchor.BN(recallAmount))
      .accounts({
        authority: authority.publicKey,
        mint: mint,
        source: investor1Ata,
        destination: treasuryAta,
        freezeAuthority: freezeAuthorityPda,
        extraAccountMetaList: extraAccountMetaListPda,
        senderInvestorRecord: senderRecord,
        receiverInvestorRecord: receiverRecord,
        complianceHookProgram: hookProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      ])
      .rpc();

    const afterAccount = await getAccount(
      connection, investor1Ata, undefined, TOKEN_2022_PROGRAM_ID
    );
    expect(Number(afterAccount.amount)).to.equal(0);
  });
});
