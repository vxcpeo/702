import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'src/composables/useMissions.js');
const source = await readFile(sourcePath, 'utf8');
const configText = await readFile(path.join(root, 'src/config.js'), 'utf8');
const env = await readFile(path.join(root, '.env'), 'utf8').catch(() => '');
const moduleSource = source
  .replace("from 'vue'", `from '${import.meta.resolve('vue')}'`)
  .replace(/import \{\s*APP_NAME,[\s\S]*?\} from '\.\.\/config';/, `const APP_NAME = 'Ledgiva', LAMPORTS_PER_SOL = 1_000_000_000n, SOLANA_CLUSTER = 'testnet', SOLANA_EXPLORER_URL = 'https://explorer.solana.com', SOLANA_NETWORK_NAME = 'Solana Testnet', SOLANA_PROGRAM_ID = '5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu', SOLANA_PROGRAM_READY = false, SOLANA_RPC_URL = 'https://api.testnet.solana.com', SOLANA_TOKEN_MINT = '', SOLANA_TOKEN_SYMBOL = 'TOKEN';`)
  .replace("import { createSolanaProgramClient } from '../utils/solanaProgram';", 'const createSolanaProgramClient = () => { throw new Error("Live client should not be created in preview tests."); };');
const app = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
const { parseTokenAmount, formatTokenAmount } = app;
const { createSSRApp } = await import('vue');
const { renderToString } = await import('vue/server-renderer');

test('runtime has Solana wallet/RPC paths and no EVM provider or signer dependency', () => {
  assert.match(source, /SOLANA_RPC_URL/);
  assert.match(source, /window\.solana/);
  assert.doesNotMatch(source, /from ['"]ethers['"]|window\.ethereum|eth_requestAccounts|wallet_switchEthereumChain/);
  assert.match(source, /preview workspace/i);
  assert.match(configText, /VITE_SOLANA_PROGRAM_ID/);
  assert.match(configText, /VITE_SOLANA_PROGRAM_READY/);
});

test('deployment and reward-mint values are intentionally empty in local configuration', () => {
  assert.match(source, /isSolanaAddress\(SOLANA_PROGRAM_ID\) && isSolanaAddress\(SOLANA_TOKEN_MINT\) && SOLANA_PROGRAM_READY/);
  assert.match(source, /preview workspace/i);
  assert.match(env, /^VITE_SOLANA_CLUSTER=testnet$/m);
  assert.match(env, /^VITE_SOLANA_PROGRAM_ID=5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu$/m);
  assert.match(env, /^VITE_SOLANA_PROGRAM_READY=false$/m);
  assert.match(env, /^VITE_SOLANA_TOKEN_MINT=$/m);
});

test('public keys and signatures must decode to their canonical 32-byte and 64-byte lengths', () => {
  assert.equal(app.isSolanaAddress('11111111111111111111111111111111'), true);
  assert.equal(app.isSolanaAddress('0'.repeat(32)), false);
  assert.equal(app.isSolanaAddress('1111111111111111111111111111111'), false);
  assert.equal(app.isSolanaAddress('1'.repeat(45)), false);
  assert.equal(app.isSolanaSignature('1'.repeat(64)), true);
  assert.equal(app.isSolanaSignature('1'.repeat(63)), false);
  assert.equal(app.isSolanaSignature('0'.repeat(64)), false);
});

test('SOL decimal conversion is exact in lamports and enforces u64 bounds', () => {
  assert.equal(app.parseSol('0.000000001'), 1n);
  assert.equal(app.parseSol('1.000000001'), 1_000_000_001n);
  assert.equal(app.parseSol('18446744073.709551615'), (1n << 64n) - 1n);
  assert.equal(app.formatSol(1n), '0.000000001');
  assert.equal(app.formatSol(1_500_000_000n), '1.5');
  assert.equal(app.formatSol(-1n), '-0.000000001');
  for (const invalid of ['0', '-1', '1e-9', '1.0000000001', '18446744073.709551616', 'Infinity']) {
    assert.throws(() => app.parseSol(invalid), `Reject invalid SOL value ${invalid}`);
  }
});

test('classic SPL reward amounts use the supplied mint decimals exactly', () => {
  assert.equal(parseTokenAmount('12.345678', 6), 12_345_678n);
  assert.equal(parseTokenAmount('1', 0), 1n);
  assert.equal(formatTokenAmount(12_345_678n, 6), '12.345678');
  assert.equal(formatTokenAmount(1n, 0), '1.0');
  assert.throws(() => parseTokenAmount('0.0000001', 6), /at most 6 decimal places/i);
  assert.throws(() => parseTokenAmount('18446744073710', 6), /u64 limit/i);
});

test('brief and evidence URLs reject unsafe schemes, credentials and X links', () => {
  for (const uri of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', '/relative', 'ftp://example.com', 'https://u:p@example.com', 'https://x.com/brief', 'https://sub.twitter.com/source', 'https://t.co/a']) {
    assert.equal(app.safeExternalUrl(uri), '', `Reject unsafe or disallowed URI ${uri}`);
  }
  assert.equal(app.safeExternalUrl('https://example.com/research'), 'https://example.com/research');
  assert.equal(app.safeExternalUrl('ipfs://Qm123456789abc/research.json'), 'https://ipfs.io/ipfs/Qm123456789abc/research.json');
});

test('mission form validation returns exact lamports and applies Solana preview constraints', () => {
  const deadline = new Date(Date.now() + 86400_000).toISOString();
  const valid = app.validateMissionForm({ title: 'A research bounty', category: 'Ecosystem', uri: 'https://example.org/brief', reward: '0.125000001', deadline });
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.values.reward, 125_000_001n);
  for (const [field, value] of [['uri', 'javascript:alert(1)'], ['reward', '0.0000000001'], ['category', 'Not a topic']]) {
    const result = app.validateMissionForm({ title: 'A research bounty', category: 'Ecosystem', uri: 'https://example.org/brief', reward: '0.1', deadline, [field]: value });
    assert.ok(result.errors[field], `Invalid ${field} should have a field error`);
  }
});

test('sample preview exposes no live bounty program or wallet-signing path', async () => {
  let state;
  await renderToString(createSSRApp({ setup() { state = app.useMissions(); return () => null; } }));
  assert.equal(state.configured.value, false);
  assert.equal(state.missionItems.value.length, 4);
  let walletConnects = 0;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { solana: { connect() { walletConnects++; } } } });
  try {
    assert.equal(await state.transact('create'), false);
    assert.equal(walletConnects, 0);
    assert.match(state.notice.value, /preview workspace/i);
  } finally {
    state.dismissNotice();
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else delete globalThis.window;
  }
});

