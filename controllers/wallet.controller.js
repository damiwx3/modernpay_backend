const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const axios = require('axios');

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

// 🏦 Transfer to Bank using Paystack
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

    // 1. Create transfer recipient
    const recipientRes = await axios.post('https://api.paystack.co/transferrecipient', {
      type: "nuban",
      name: req.user.fullName || req.user.name || "User",
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN"
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });

    const recipientCode = recipientRes.data.data.recipient_code;

    // 2. Initiate transfer
    const transferRes = await axios.post('https://api.paystack.co/transfer', {
      source: "balance",
      amount: Math.round(value * 100), // Paystack expects kobo
      recipient: recipientCode,
      reason: narration || "Wallet withdrawal"
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });

    // Deduct from wallet if transfer is successful
    if (transferRes.data.data.status === 'success' || transferRes.data.data.status === 'pending') {
      wallet.balance = parseFloat(wallet.balance) - value;
      await wallet.save();

      await db.Transaction.create({
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: transferRes.data.data.reference,
        description: `Transfer to bank (${accountNumber})`,
        status: transferRes.data.data.status,
        category: 'Bank Transfer',
        senderName: req.user.name || null,
        recipientName: recipientRes.data.data.details?.account_name || null,
        recipientAccount: accountNumber,
      });

      logWalletAction(req.user.id, 'transferToBank', { bankCode, accountNumber, amount: value });
      return res.status(200).json({ message: 'Bank transfer initiated', transfer: transferRes.data.data });
    } else {
      return res.status(400).json({ message: 'Bank transfer failed', transfer: transferRes.data.data });
    }
  } catch (err) {
    res.status(500).json({ message: 'Bank transfer failed', error: err.response?.data || err.message });
  }
};


exports.createVirtualAccount = async (req, res) => {
  const { email, firstName, lastName, preferred_bank } = req.body;
  try {
    // 1. Check if user already has a virtual account
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingAccount = await db.VirtualAccount.findOne({ where: { userId: user.id } });
    if (existingAccount) {
      return res.status(200).json({ message: 'Virtual account already exists', account: existingAccount });
    }

    // 2. Create virtual account via Paystack
    const response = await axios.post(
      'https://api.paystack.co/dedicated_account',
      {
        customer: email, // or Paystack customer code if you have it
        preferred_bank: preferred_bank, // optional
        first_name: firstName,
        last_name: lastName,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 3. Store returned account details in your DB
    const accountData = response.data.data;
    const savedAccount = await db.VirtualAccount.create({
      userId: user.id,
      accountNumber: accountData.account_number,
      bankName: accountData.bank.name,
      bankId: accountData.bank.id,
      accountName: accountData.account_name,
      paystackCustomerCode: accountData.customer,
      paystackAccountId: accountData.id,
      raw: accountData, // Optionally store the full response for reference
    });

    res.status(200).json({ message: 'Virtual account created', account: savedAccount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create virtual account', error: err.response?.data || err.message });
  }
};
