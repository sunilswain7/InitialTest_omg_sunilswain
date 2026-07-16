const crypto = require('crypto');
const { blockchain, Transaction } = require('../models');
const persistenceService = require('../services/persistence.service');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');

const addTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, signature } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    if (signature) {
      transaction.signature = signature;
    }

    try {
      blockchain.addTransaction(transaction);
    } catch (domainErr) {
      return sendError(res, domainErr.message, 400);
    }
    persistenceService.save(blockchain);

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

const createSignedTransaction = (req, res, next) => {
    try {
      const { privateKey, toAddress, amount } = req.body;

      if (!isValidAddress(toAddress)) {
        return sendError(res, 'Invalid recipient address', 400);
      }

      if (!isValidAmount(amount)) {
        return sendError(res, 'Amount must be a positive number', 400);
      }

      let keyObject;
      try {
        keyObject = crypto.createPrivateKey(privateKey);
      } catch {
        return sendError(res, 'Invalid private key format', 400);
      }

      const transaction = new Transaction(
        '',
        sanitizeAddress(toAddress),
        sanitizeAmount(amount)
      );
      transaction.signTransaction(keyObject);

      try {
        blockchain.addTransaction(transaction);
      } catch (domainErr) {
        return sendError(res, domainErr.message, 400);
      }
      persistenceService.save(blockchain);

      sendCreated(res, {
        message: 'Signed transaction added to pending pool',
        transaction: {
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          timestamp: transaction.timestamp,
        },
      });
    } catch (err) {
      next(err);
    }
  };

module.exports = { addTransaction, getPendingTransactions, getAllTransactions, createSignedTransaction };
