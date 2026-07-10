import React, { useState } from 'react';
  import './TransactionForm.css';
  import { addSignedTransaction } from '../api/blockchain.api';

  const TransactionForm = ({ onTransactionAdded }) => {
    const [formData, setFormData] = useState({
      privateKey: '',
      toAddress: '',
      amount: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setMessage('');
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');

      try {
        await addSignedTransaction(formData.privateKey, formData.toAddress, formData.amount);
        setMessage('Transaction added successfully!');
        setFormData({ privateKey: '', toAddress: '', amount: '' });
        onTransactionAdded();
      } catch (err) {
        setMessage(err.message || 'Failed to add transaction');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="transaction-form">
        <h2 className="panel-title">Create Transaction</h2>

        <form onSubmit={handleSubmit}>
          <p className="panel-subtitle">
            Paste your private key from the Wallet Studio above to sign and submit a transaction.
          </p>

          <div className="form-group">
            <label htmlFor="privateKey">Private Key (PEM)</label>
            <textarea
              id="privateKey"
              name="privateKey"
              value={formData.privateKey}
              onChange={handleChange}
              placeholder="private key in PEM format"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="toAddress">To Address</label>
            <input
              type="text"
              id="toAddress"
              name="toAddress"
              value={formData.toAddress}
              onChange={handleChange}
              placeholder="Recipient public key or address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g., 100"
              step="0.01"
              min="0"
              required
            />
          </div>

          {message && (
            <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Signing & Sending...' : 'Sign & Send Transaction'}
          </button>
        </form>
      </div>
    );
  };

  export default TransactionForm;