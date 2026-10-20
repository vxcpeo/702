import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  createSolanaProgramClient,
  decodeAccountData,
  parseContribution,
  parseConfig,
  parseMission,
} from '../src/utils/solanaProgram.js';

const IDL = JSON.parse(await readFile(new URL('../../contracts/idl/bountelith_escrow.json', import.meta.url), 'utf8'));
const PROGRAM = new PublicKey(IDL.address);
const MINT = SystemProgram.programId;
const CREATOR = new PublicKey('SysvarRent111111111111111111111111111111111');
const accountDiscriminator = (name) => Buffer.from(IDL.accounts.find((account) => account.name === name).discriminator);
const MISSION_DISCRIMINATOR = accountDiscriminator('Mission');
const CONTRIBUTION_DISCRIMINATOR = accountDiscriminator('Contribution');
const CONFIG_DISCRIMINATOR = accountDiscriminator('Config');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const INSTRUCTION_DISCRIMINATORS = Object.fromEntries(IDL.instructions.map(({ name, discriminator }) => [name, discriminator]));
const ACCOUNT_ORDERS = {
  initialize: ['mint', 'config', 'payer', 'system_program'],
  create_mission: ['mint', 'config', 'mission', 'creator', 'creator_token_account', 'vault', 'token_program', 'associated_token_program', 'system_program'],
  fund_mission: ['mission', 'mint', 'vault', 'funder_token_account', 'funder', 'token_program'],
  submit_contribution: ['mission', 'contribution', 'contributor', 'system_program'],
  approve_contribution: ['mission', 'contribution', 'creator'],
  claim_contribution: ['mission', 'contribution', 'payer', 'mint', 'vault', 'contributor', 'contributor_token_account', 'token_program', 'associated_token_program', 'system_program'],
  refund_unallocated: ['mission', 'creator', 'mint', 'vault', 'creator_token_account', 'token_program', 'associated_token_program', 'system_program'],
};

function integer(value, bytes, method) {
  const result = Buffer.alloc(bytes);
  result[method](value, 0, true);
  return result;
}

function borshString(value) {
  return Buffer.concat([integer(Buffer.byteLength(value), 4, 'writeUInt32LE'), Buffer.from(value)]);
}

function configData({ mint = MINT, nextMissionId = 0n } = {}) {
  return Buffer.concat([CONFIG_DISCRIMINATOR, mint.toBuffer(), integer(nextMissionId, 8, 'writeBigUInt64LE')]);
}

function text(value) {
  const bytes = Buffer.from(value, 'utf8');
  const length = Buffer.alloc(4);
  length.writeUInt32LE(bytes.length);
  return Buffer.concat([length, bytes]);
}

function missionData({ id = 7n, creator = CREATOR, mint = MINT, count = 1 } = {}) {
  const integers = (value, size, write) => {
    const bytes = Buffer.alloc(size);
    bytes[write](value, 0, true);
    return bytes;
  };
  return Buffer.concat([
    MISSION_DISCRIMINATOR,
    integers(id, 8, 'writeBigUInt64LE'), creator.toBuffer(), mint.toBuffer(),
    text('A Solana bounty'), text('https://example.org/brief'), text('Ecosystem'),
    integers(1_900_000_000n, 8, 'writeBigInt64LE'),
    integers(500_000n, 8, 'writeBigUInt64LE'), integers(0n, 8, 'writeBigUInt64LE'),
    integers(0n, 8, 'writeBigUInt64LE'), integers(count, 4, 'writeUInt32LE'),
    Buffer.from([0, 254]),
  ]);
}

function contributionData(mission, contributor = CREATOR) {
  const length = Buffer.alloc(4);
  length.writeUInt32LE(Buffer.byteLength('ipfs://proof'));
  return Buffer.concat([
    CONTRIBUTION_DISCRIMINATOR, mission.toBuffer(), contributor.toBuffer(),
    Buffer.from([0, 0, 0, 0]), length, Buffer.from('ipfs://proof'),
    Buffer.from([9, 0, 0, 0, 0, 0, 0, 0, 1, 0, 255]),
  ]);
}

test('web3 buffers and Anchor account layouts decode with discriminators and bumps', () => {
  const program = PROGRAM;
  const id = 7n;
  const [missionKey] = PublicKey.findProgramAddressSync([
    Buffer.from('mission'), MINT.toBuffer(), Buffer.from(Buffer.from([7, 0, 0, 0, 0, 0, 0, 0])),
  ], program);
  const mission = parseMission(missionKey, Buffer.from(missionData({ id })));
  assert.equal(mission.id, id);
  assert.equal(mission.creator, CREATOR.toBase58());
  assert.equal(mission.mint, MINT.toBase58());
  assert.equal(mission.title, 'A Solana bounty');
  assert.equal(mission.contributionCount, 1);
  assert.equal(mission.bump, 254);
  assert.equal(parseMission(missionKey, Buffer.concat([missionData({ id }), Buffer.alloc(96)])).title, 'A Solana bounty');
  assert.deepEqual([...decodeAccountData(Buffer.from([1, 2, 3]))], [1, 2, 3]);
  assert.throws(() => parseMission(missionKey, Buffer.alloc(missionData({ id }).length)), /discriminator/i);

  const [contributionKey] = PublicKey.findProgramAddressSync([
    Buffer.from('contribution'), missionKey.toBuffer(), Buffer.from([0, 0, 0, 0]),
  ], program);
  const contribution = parseContribution(contributionKey, contributionData(missionKey));
  assert.equal(contribution.mission, missionKey.toBase58());
  assert.equal(contribution.evidenceURI, 'ipfs://proof');
  assert.equal(contribution.approvedAmount, 9n);
  assert.equal(contribution.approvedByCreator, true);
  assert.equal(contribution.claimed, false);
  assert.equal(contribution.bump, 255);
});

test('account decoders accept web3 byte views and reject malformed Anchor layouts', () => {
  const key = CREATOR;
  const bytes = configData({ nextMissionId: (1n << 64n) - 1n });
  assert.equal(parseConfig(key, new Uint8Array(bytes)).nextMissionId, (1n << 64n) - 1n);
  assert.deepEqual([...decodeAccountData(new DataView(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)))], [...bytes]);
  assert.deepEqual([...decodeAccountData([bytes.toString('base64'), 'base64'])], [...bytes]);
  assert.throws(() => parseConfig(key, Buffer.concat([bytes, Buffer.from([0])])), /unexpected size/i);
  assert.throws(() => parseConfig(key, Buffer.alloc(48)), /discriminator/i);
  assert.throws(() => parseMission(key, Buffer.concat([MISSION_DISCRIMINATOR, Buffer.from([0])])), /ended before/i);
  assert.throws(() => parseContribution(key, Buffer.alloc(128)), /discriminator/i);
  const invalidBoolean = missionData();
  invalidBoolean[invalidBoolean.length - 2] = 2;
  assert.throws(() => parseMission(key, invalidBoolean), /boolean/i);
});

test('first mission creation initializes its mint config and uses Anchor-compatible PDA and instruction bytes', async () => {
  let captured;
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config'), MINT.toBuffer()], PROGRAM);
  const [mission] = PublicKey.findProgramAddressSync([
    Buffer.from('mission'), MINT.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
  ], PROGRAM);
  const connection = {
    async getAccountInfo(address) { assert.ok(address.equals(config)); return null; },
    async getLatestBlockhash() { return { blockhash: SystemProgram.programId.toBase58(), lastValidBlockHeight: 12 }; },
    async confirmTransaction() { return { value: { err: null } }; },
    async sendRawTransaction(raw) { assert.ok(raw instanceof Buffer); return '1'.repeat(64); },
  };
  const provider = {
    publicKey: CREATOR,
    async signTransaction(transaction) { captured = transaction; return { serialize() { return Buffer.from([1]); } }; },
  };
  const client = createSolanaProgramClient({ programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider, connection });
  const signature = await client.createMission({
    title: 'A Solana bounty', descriptionURI: 'https://example.org/brief',
    category: 'Ecosystem', deadline: 1_900_000_000, amount: 15n,
  });
  assert.equal(signature, '1'.repeat(64));
  assert.equal(captured.instructions.length, 3);
  assert.deepEqual([...captured.instructions[0].data], [175, 175, 109, 31, 13, 152, 155, 237]);
  assert.equal(captured.instructions[0].keys[1].pubkey.toBase58(), config.toBase58());
  assert.deepEqual([...captured.instructions[1].data], [1]);
  assert.deepEqual([...captured.instructions[2].data.slice(0, 8)], [15, 28, 105, 135, 65, 62, 188, 255]);
  assert.equal(captured.instructions[2].keys[2].pubkey.toBase58(), mission.toBase58());
  assert.equal(captured.instructions[2].keys[0].pubkey.toBase58(), MINT.toBase58());
});

test('mission listing validates program ownership and filters the selected mint', async () => {
  const id = 2n;
  const [missionKey] = PublicKey.findProgramAddressSync([
    Buffer.from('mission'), MINT.toBuffer(), Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]),
  ], PROGRAM);
  let filters;
  const connection = {
    async getProgramAccounts(program, options) {
      assert.ok(program.equals(PROGRAM));
      filters = options.filters;
      return [{ pubkey: missionKey, account: { owner: PROGRAM, data: missionData({ id }) } }];
    },
  };
  const client = createSolanaProgramClient({
    programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider: { publicKey: CREATOR }, connection,
  });
  const items = await client.listMissions();
  assert.equal(items.length, 1);
  assert.equal(items[0].pubkey, missionKey.toBase58());
  assert.equal(filters[1].memcmp.offset, 48);
  await assert.rejects(
    createSolanaProgramClient({
      programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider: { publicKey: CREATOR },
      connection: { async getProgramAccounts() { return [{ pubkey: missionKey, account: { owner: CREATOR, data: missionData({ id }) } }]; } },
    }).listMissions(),
    /owned by a different program/i,
  );
});

test('config reads enforce program ownership, discriminator, and mint binding', async () => {
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config'), MINT.toBuffer()], PROGRAM);
  let account = { owner: CREATOR, data: configData() };
  const client = createSolanaProgramClient({
    programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider: { publicKey: CREATOR },
    connection: { async getAccountInfo(address) { assert.ok(address.equals(config)); return account; } },
  });
  await assert.rejects(client.readConfig(), /owned by a different program/i);
  account = { owner: PROGRAM, data: Buffer.alloc(48) };
  await assert.rejects(client.readConfig(), /discriminator/i);
  account = { owner: PROGRAM, data: configData({ mint: CREATOR }) };
  await assert.rejects(client.readConfig(), /different reward mint/i);
});

test('all client instructions match Anchor discriminators, account order, and Borsh argument boundaries', async () => {
  const missionId = 7n;
  const contributionId = 1;
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config'), MINT.toBuffer()], PROGRAM);
  const [mission] = PublicKey.findProgramAddressSync([
    Buffer.from('mission'), MINT.toBuffer(), integer(missionId, 8, 'writeBigUInt64LE'),
  ], PROGRAM);
  const [contribution] = PublicKey.findProgramAddressSync([
    Buffer.from('contribution'), mission.toBuffer(), integer(contributionId, 4, 'writeUInt32LE'),
  ], PROGRAM);
  const [submittedContribution] = PublicKey.findProgramAddressSync([
    Buffer.from('contribution'), mission.toBuffer(), integer(2, 4, 'writeUInt32LE'),
  ], PROGRAM);
  const associatedAddress = (owner) => PublicKey.findProgramAddressSync([
    owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), MINT.toBuffer(),
  ], ASSOCIATED_TOKEN_PROGRAM)[0];
  const creatorTokenAccount = associatedAddress(CREATOR);
  const vault = associatedAddress(mission);
  const transactions = [];
  const initializeConnection = {
    async getAccountInfo() { return null; },
    async getLatestBlockhash() { return { blockhash: SystemProgram.programId.toBase58(), lastValidBlockHeight: 12 }; },
    async confirmTransaction() { return { value: { err: null } }; },
    async sendRawTransaction() { return '1'.repeat(64); },
  };
  const provider = {
    publicKey: CREATOR,
    async signTransaction(transaction) {
      transactions.push(transaction);
      return { serialize() { return Buffer.from([1]); } };
    },
  };
  const initializer = createSolanaProgramClient({ programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider, connection: initializeConnection });
  await initializer.initializeNamespace();
  const connection = {
    async getAccountInfo(address) {
      if (address.equals(config)) return { owner: PROGRAM, data: configData({ nextMissionId: missionId }) };
      if (address.equals(mission)) return { owner: PROGRAM, data: missionData({ id: missionId, mint: MINT, count: 2 }) };
      return null;
    },
    async getLatestBlockhash() { return { blockhash: SystemProgram.programId.toBase58(), lastValidBlockHeight: 12 }; },
    async confirmTransaction() { return { value: { err: null } }; },
    async sendRawTransaction() { return '1'.repeat(64); },
  };
  const client = createSolanaProgramClient({ programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider, connection });
  const title = 'Bounty';
  const uri = 'https://example.org/brief';
  const category = 'Ecosystem';
  const deadline = 1_900_000_000n;
  await client.createMission({ title, descriptionURI: uri, category, deadline, amount: (1n << 64n) - 1n });
  await client.fundMission(missionId, (1n << 64n) - 1n);
  await client.submitContribution(missionId, 'ipfs://proof');
  await client.approveContribution(missionId, contributionId, 9n);
  await client.claimContribution(missionId, contributionId);
  await client.refundUnallocated(missionId);

  const byName = {
    initialize: transactions[0].instructions[0],
    create_mission: transactions[1].instructions[1],
    fund_mission: transactions[2].instructions[1],
    submit_contribution: transactions[3].instructions[0],
    approve_contribution: transactions[4].instructions[0],
    claim_contribution: transactions[5].instructions[0],
    refund_unallocated: transactions[6].instructions[0],
  };
  for (const [name, expected] of Object.entries(INSTRUCTION_DISCRIMINATORS)) {
    assert.deepEqual([...byName[name].data.subarray(0, 8)], expected, `${name} discriminator`);
  }
  assert.deepEqual([...transactions[1].instructions[0].data], [1], 'creation ATA setup is idempotent Create');
  assert.deepEqual([...transactions[2].instructions[0].data], [1], 'funding ATA setup is idempotent Create');

  const metas = (instruction) => instruction.keys.map(({ pubkey, isSigner, isWritable }) => [pubkey.toBase58(), isSigner, isWritable]);
  assert.deepEqual(metas(byName.initialize), [
    [MINT.toBase58(), false, false], [config.toBase58(), false, true], [CREATOR.toBase58(), true, true], [SystemProgram.programId.toBase58(), false, false],
  ]);
  const accountAddresses = {
    initialize: [MINT, config, CREATOR, SystemProgram.programId],
    create_mission: [MINT, config, mission, CREATOR, creatorTokenAccount, vault, TOKEN_PROGRAM, ASSOCIATED_TOKEN_PROGRAM, SystemProgram.programId],
    fund_mission: [mission, MINT, vault, creatorTokenAccount, CREATOR, TOKEN_PROGRAM],
    submit_contribution: [mission, submittedContribution, CREATOR, SystemProgram.programId],
    approve_contribution: [mission, contribution, CREATOR],
    claim_contribution: [mission, contribution, CREATOR, MINT, vault, CREATOR, creatorTokenAccount, TOKEN_PROGRAM, ASSOCIATED_TOKEN_PROGRAM, SystemProgram.programId],
    refund_unallocated: [mission, CREATOR, MINT, vault, creatorTokenAccount, TOKEN_PROGRAM, ASSOCIATED_TOKEN_PROGRAM, SystemProgram.programId],
  };
  for (const [name, instruction] of Object.entries(byName)) {
    const schema = IDL.instructions.find((entry) => entry.name === name);
    assert.ok(schema, `${name} exists in the generated Anchor IDL`);
    assert.deepEqual(schema.accounts.map((account) => account.name), ACCOUNT_ORDERS[name], `${name} IDL account order`);
    assert.deepEqual(instruction.keys.map(({ pubkey }) => pubkey.toBase58()), accountAddresses[name].map((pubkey) => pubkey.toBase58()), `${name} client account order`);
    assert.deepEqual(instruction.keys.map(({ isSigner, isWritable }) => [isSigner, isWritable]), schema.accounts.map((account) => [Boolean(account.signer), Boolean(account.writable)]), `${name} account privileges`);
  }

  const encodedCreateArgs = Buffer.concat([
    integer(missionId, 8, 'writeBigUInt64LE'), borshString(title), borshString(uri), borshString(category),
    integer(deadline, 8, 'writeBigInt64LE'), Buffer.alloc(8, 0xff),
  ]);
  assert.deepEqual(Buffer.from(byName.create_mission.data.subarray(8)), encodedCreateArgs);
  assert.deepEqual(Buffer.from(byName.fund_mission.data.subarray(8)), Buffer.concat([integer(missionId, 8, 'writeBigUInt64LE'), Buffer.alloc(8, 0xff)]));
  assert.deepEqual(Buffer.from(byName.submit_contribution.data.subarray(8)), Buffer.concat([integer(missionId, 8, 'writeBigUInt64LE'), borshString('ipfs://proof')]));
  assert.deepEqual(Buffer.from(byName.approve_contribution.data.subarray(8)), Buffer.concat([integer(missionId, 8, 'writeBigUInt64LE'), integer(contributionId, 4, 'writeUInt32LE'), integer(9n, 8, 'writeBigUInt64LE')]));
  assert.deepEqual(Buffer.from(byName.claim_contribution.data.subarray(8)), Buffer.concat([integer(missionId, 8, 'writeBigUInt64LE'), integer(contributionId, 4, 'writeUInt32LE')]));
  assert.deepEqual(Buffer.from(byName.refund_unallocated.data.subarray(8)), integer(missionId, 8, 'writeBigUInt64LE'));
});

test('configured reward mint and ATA balance must use initialized classic SPL Token accounts', async () => {
  const associated = PublicKey.findProgramAddressSync([
    CREATOR.toBuffer(), TOKEN_PROGRAM.toBuffer(), MINT.toBuffer(),
  ], ASSOCIATED_TOKEN_PROGRAM)[0];
  const mintData = Buffer.alloc(82);
  mintData[44] = 6;
  mintData[45] = 1;
  const tokenData = Buffer.alloc(165);
  MINT.toBuffer().copy(tokenData, 0);
  CREATOR.toBuffer().copy(tokenData, 32);
  integer(123_456n, 8, 'writeBigUInt64LE').copy(tokenData, 64);
  tokenData[108] = 1;
  let mintOwner = TOKEN_PROGRAM;
  const connection = {
    async getAccountInfo(address) {
      if (address.equals(MINT)) return { owner: mintOwner, data: mintData };
      if (address.equals(associated)) return { owner: TOKEN_PROGRAM, data: tokenData };
      return null;
    },
  };
  const client = createSolanaProgramClient({
    programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider: { publicKey: CREATOR }, connection,
  });
  assert.equal(await client.mintDecimals(), 6);
  assert.equal(await client.getWalletTokenBalance(CREATOR), 123_456n);
  mintOwner = PROGRAM;
  await assert.rejects(client.mintDecimals(), /classic SPL Token Program/i);
});

test('integer encoders reject values outside Anchor u64/i64/u32 boundaries', async () => {
  const client = createSolanaProgramClient({
    programId: PROGRAM.toBase58(), mint: MINT.toBase58(), provider: { publicKey: CREATOR },
    connection: {
      async getAccountInfo() { return null; },
      async getLatestBlockhash() { throw new Error('Should fail before RPC submission.'); },
      async sendRawTransaction() { throw new Error('Should fail before RPC submission.'); },
    },
  });
  await assert.rejects(client.refundUnallocated(1n << 64n), /u64 range/i);
  await assert.rejects(client.approveContribution(0n, 0x1_0000_0000, 1n), /u32 range/i);
  await assert.rejects(client.fundMission(0n, -1n), /u64 range/i);
  await assert.rejects(client.createMission({
    title: 'Bounty', descriptionURI: 'https://example.org', category: 'Ecosystem',
    deadline: (1n << 63n), amount: 1n,
  }), /i64 range/i);
});
