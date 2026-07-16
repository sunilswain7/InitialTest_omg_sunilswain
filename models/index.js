const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const persistenceService = require('../services/persistence.service');
const { Blockchain, Block, Transaction } = require('./blockchain');

let blockchain = new Blockchain(
  config.blockchain.difficulty,
  config.blockchain.miningReward
);

const seedDemoData = () => {
  if (!config.demoData.enabled) {
    return;
  }

  // Each named demo participant gets a real keypair. Senders must hold funds
  // before their transfers pass the balance check, so every distinct sender
  // is funded with one mining reward up front.
  const wallets = {};
  const walletFor = (name) => {
    if (!wallets[name]) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
      wallets[name] = {
        privateKey,
        address: publicKey.export({ type: 'spki', format: 'der' }).toString('hex'),
      };
    }
    return wallets[name];
  };

  const senders = new Set(config.demoData.transactions.map((tx) => tx.from));
  for (const sender of senders) {
    blockchain.minePendingTransactions(walletFor(sender).address);
  }

  for (const { from, to, amount } of config.demoData.transactions) {
    const demoTx = new Transaction(walletFor(from).address, walletFor(to).address, amount);
    demoTx.signTransaction(walletFor(from).privateKey);
    blockchain.addTransaction(demoTx);
  }

  if (blockchain.pendingTransactions.length > 0) {
    blockchain.minePendingTransactions(config.blockchain.initialMinerAddress);
    logger.info('Seeded demo blockchain data');
  }
};

const initializeBlockchain = async () => {
  const restored = await persistenceService.load();

  if (restored) {
    blockchain.chain = restored.chain;
    blockchain.pendingTransactions = restored.pendingTransactions;
    blockchain.difficulty = restored.difficulty;
    blockchain.miningReward = restored.miningReward;
    logger.info('Loaded persisted blockchain state');
    return;
  }

  seedDemoData();
  if (blockchain.chain.length > 1 || blockchain.pendingTransactions.length > 0) {
    await persistenceService.save(blockchain);
  }
};



module.exports = {
  get blockchain() {
    return blockchain;
  },
  Blockchain,
  Block,
  Transaction,
  initializeBlockchain,
};
