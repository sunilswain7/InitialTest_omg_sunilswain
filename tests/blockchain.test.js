const test = require('node:test');
const assert = require('node:assert/strict');

const { Blockchain, Transaction } = require('../models/blockchain');
const persistenceService = require('../services/persistence.service');

const originalStatePath = process.env.BLOCKCHAIN_STATE_PATH;

test.beforeEach(async () => {
  process.env.BLOCKCHAIN_STATE_PATH = `${process.cwd()}/tests/.tmp-blockchain.json`;
  await persistenceService.clear();
});

test.afterEach(async () => {
  if (originalStatePath === undefined) {
    delete process.env.BLOCKCHAIN_STATE_PATH;
  } else {
    process.env.BLOCKCHAIN_STATE_PATH = originalStatePath;
  }
  await persistenceService.clear();
});

test('rejects unsigned transactions', () => {
  const chain = new Blockchain(1, 10);
  const tx = new Transaction('wallet-a', 'wallet-b', 25);

  assert.throws(() => chain.addTransaction(tx), /unsigned|invalid/i);
});

test('rejects transactions that exceed the sender balance', () => {
  const crypto = require('crypto');
  const chain = new Blockchain(1, 10);

  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
  const tx = new Transaction('', 'wallet-b', 25);
  tx.signTransaction(privateKey);

  assert.throws(() => chain.addTransaction(tx), /insufficient/i);
});

test('persists and restores blockchain state', async () => {
    const crypto = require('crypto');
    const chain = new Blockchain(1, 10);

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
    const address = publicKey.export({ type: 'spki', format: 'der' }).toString('hex');

    // fund the sender with one mining reward (10) so the transfer passes the balance check
    chain.minePendingTransactions(address);

    const tx = new Transaction(address, 'wallet-b', 5);
    tx.signTransaction(privateKey);

    chain.addTransaction(tx);

    await persistenceService.save(chain);
    const restored = await persistenceService.load();

    assert.ok(restored);
    assert.equal(restored.chain.length, 2);
    assert.equal(restored.pendingTransactions.length, 1);
    assert.equal(restored.pendingTransactions[0].amount, 5);
  });
