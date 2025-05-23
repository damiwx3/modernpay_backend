const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const monnify = require('../utils/monnify'); // ✅ Use the Monnify util

const logger = require('../utils/logger');

function logWalletAction(userId, action, details) {
  logger.info({ userId, action, ...details });
}

// Placeholder for rate limiting/fraud check (implement as needed)
async function checkRateLimitOrFraud(userId, action) {
  // Example: throw new Error('Too many requests');
}

// 📘 Get Wallet Balance & Account Info
exports.getBalance = async (req, res) => {
  try {
    await checkRateLimitOrFraud(req.user.id, 'getBalance');
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    logWalletAction(req.user.id, 'getBalance', { balance: wallet.balance });
    res.status(200).json({
      balance: wallet.balance,
      accountNumber: wallet.accountNumber,
      bankName: wallet.bankName,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve balance', error: err.message });
  }
};

// 💰 Manual Wallet Funding
exports.fundWallet = async (req, res) => {
  const { amount } = req.body;
  const value = parseFloat(amount);

  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    await checkRateLimitOrFraud(req.user.id, 'fundWallet');
    let wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet) {
      wallet = await db.Wallet.create({
        userId: req.user.id,
        balance: 0,
        accountNumber: null,
      });
    }

    wallet.balance += value;
    await wallet.save();

    await db.Transaction.create({
      userId: req.user.id,
      type: 'credit',
      amount: value,
      reference: uuidv4(),
      description: 'Manual Wallet Top-up',
      status: 'success',
    });

    logWalletAction(req.user.id, 'fundWallet', { amount: value, newBalance: wallet.balance });
    res.status(200).json({ message: 'Wallet funded successfully', newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Funding failed', error: err.message });
  }
};

// 🔁 Transfer to another user via account number (Monnify)
exports.transferFunds = async (req, res) => {
  const { recipientAccountNumber, amount } = req.body;
  const value = parseFloat(amount);

  if (!recipientAccountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  try {
    await checkRateLimitOrFraud(req.user.id, 'transferFunds');
    const senderWallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    const recipientWallet = await db.Wallet.findOne({ where: { accountNumber: recipientAccountNumber } });

    if (!recipientWallet) return res.status(404).json({ message: 'Recipient not found' });
    if (recipientWallet.userId === req.user.id) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    if (!senderWallet || senderWallet.balance < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    senderWallet.balance -= value;
    recipientWallet.balance += value;
    await senderWallet.save();
    await recipientWallet.save();

    await db.Transaction.bulkCreate([
      {
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: uuidv4(),
        description: `Transfer to ${recipientAccountNumber}`,
        status: 'success',
      },
      {
        userId: recipientWallet.userId,
        type: 'credit',
        amount: value,
        reference: uuidv4(),
        description: `Received from ${senderWallet.accountNumber}`,
        status: 'success',
      },
    ]);

    logWalletAction(req.user.id, 'transferFunds', { to: recipientAccountNumber, amount: value });
    res.status(200).json({ message: 'Transfer successful', senderBalance: senderWallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};

// 🏦 External bank transfer (Monnify does not support direct payouts to other banks via API for all businesses; you may need to use a payout partner or Monnify's disbursement product if available)

// 🧾 Create Virtual Account using Monnify util
exports.createVirtualAccount = async (req, res) => {
  const user = await db.User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    const accountReference = `VA-${Date.now()}-${user.id}`;
    const reservedAccount = await monnify.createReservedAccount(user, accountReference);

    await db.Wallet.update(
      {
        accountNumber: reservedAccount.accountNumber,
        bankName: reservedAccount.bankName,
      },
      { where: { userId: req.user.id } }
    );

    logWalletAction(req.user.id, 'createVirtualAccount', { accountNumber: reservedAccount.accountNumber, bank: reservedAccount.bankName });
    return res.status(201).json({
      message: 'Virtual account created',
      accountNumber: reservedAccount.accountNumber,
      bank: reservedAccount.bankName,
    });
  } catch (err) {
    console.error('Monnify VA error:', err.response?.data || err.message);
    logWalletAction(req.user.id, 'createVirtualAccountError', { error: err.message });
    return res.status(500).json({ message: 'Failed to create virtual account', error: err.message });
  }
};
