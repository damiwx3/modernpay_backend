const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const moniepoint = require('../utils/moniepoint');

function logWalletAction(userId, action, details) {
  logger.info({ userId, action, ...details });
}

// Placeholder for rate limiting/fraud check (implement as needed)
async function checkRateLimitOrFraud(userId, action) {
  // Example: throw new Error('Too many requests');
}

// 📘 Get Wallet Balance & Account Info
exports.getBalance = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
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

// 💰 Manual Wallet Funding (for admin/testing only)
exports.fundWallet = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
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

    // FIX: Always use parseFloat for DECIMAL fields!
    wallet.balance = parseFloat(wallet.balance) + value;
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

// 🔁 Transfer to another user via account number
exports.transferFunds = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { recipientAccountNumber, amount } = req.body;
  const value = parseFloat(amount);

  if (!recipientAccountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  const t = await db.sequelize.transaction();
  try {
    await checkRateLimitOrFraud(req.user.id, 'transferFunds');
    const senderWallet = await db.Wallet.findOne({ where: { userId: req.user.id }, transaction: t });
    const recipientWallet = await db.Wallet.findOne({ where: { accountNumber: recipientAccountNumber }, transaction: t });

    if (!recipientWallet) return res.status(404).json({ message: 'Recipient not found' });
    if (recipientWallet.userId === req.user.id) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    if (!senderWallet || parseFloat(senderWallet.balance) < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // FIX: Always use parseFloat for DECIMAL fields!
    senderWallet.balance = parseFloat(senderWallet.balance) - value;
    recipientWallet.balance = parseFloat(recipientWallet.balance) + value;
    await senderWallet.save({ transaction: t });
    await recipientWallet.save({ transaction: t });

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
    ], { transaction: t });

    await t.commit();

    logWalletAction(req.user.id, 'transferFunds', { to: recipientAccountNumber, amount: value });
    res.status(200).json({ message: 'Transfer successful', senderBalance: senderWallet.balance });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};

// 🏦 Transfer to Bank using Moniepoint
exports.transferToBank = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { bankCode, accountNumber, amount, narration } = req.body;
  const value = parseFloat(amount);

  if (!bankCode || !accountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  try {
    await checkRateLimitOrFraud(req.user.id, 'transferToBank');
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet || parseFloat(wallet.balance) < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Call Moniepoint util to initiate transfer
    const transferResult = await moniepoint.transferToBank({
      bankCode,
      accountNumber,
      amount: value,
      narration: narration || 'Wallet withdrawal',
      user: req.user,
    });

    // Deduct from wallet if transfer is successful
    if (transferResult.status === 'SUCCESSFUL') {
      // FIX: Always use parseFloat for DECIMAL fields!
      wallet.balance = parseFloat(wallet.balance) - value;
      await wallet.save();

      await db.Transaction.create({
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: transferResult.reference || transferResult.id || uuidv4(),
        description: `Transfer to bank (${accountNumber})`,
        status: 'success',
      });

      logWalletAction(req.user.id, 'transferToBank', { bankCode, accountNumber, amount: value });
      return res.status(200).json({ message: 'Bank transfer successful', transfer: transferResult });
    } else {
      return res.status(400).json({ message: 'Bank transfer failed', transfer: transferResult });
    }
  } catch (err) {
    res.status(500).json({ message: 'Bank transfer failed', error: err.message });
  }
};

// 🧾 Create Virtual Account using Moniepoint
exports.createVirtualAccount = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const user = await db.User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Get BVN or NIN from request body
  const { bvnOrNin } = req.body;
  if (!bvnOrNin) {
    return res.status(400).json({ message: 'BVN or NIN is required to create a virtual account.' });
  }

  try {
    // Call Moniepoint util to create a virtual account
    const reservedAccount = await moniepoint.createVirtualAccount(user, bvnOrNin);

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
    console.error('Moniepoint VA error:', err.response?.data || err.message);
    logWalletAction(req.user.id, 'createVirtualAccountError', { error: err.message });
    return res.status(500).json({ message: 'Failed to create virtual account', error: err.message });
  }
};
