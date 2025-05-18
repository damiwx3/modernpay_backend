const db = require('../models');
const axios = require('axios');
const generateAccountNumber = require('../utils/generateAccountNumber');
const { v4: uuidv4 } = require('uuid');

// 📘 Get wallet balance and account number
exports.getBalance = async (req, res) => {
  try {
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    res.status(200).json({ balance: wallet.balance, accountNumber: wallet.accountNumber });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve balance', error: err.message });
  }
};

// 💰 Fund wallet manually (no gateway)
exports.fundWallet = async (req, res) => {
  const { amount } = req.body;

  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    let wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet) {
      const accountNumber = await generateAccountNumber();
      wallet = await db.Wallet.create({
        userId: req.user.id,
        balance: 0,
        accountNumber
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
      status: 'success'
    });

    res.status(200).json({ message: 'Wallet funded successfully', newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Funding failed', error: err.message });
  }
};

// 🔁 Transfer to another user via account number
exports.transferFunds = async (req, res) => {
  const { recipientAccountNumber, amount } = req.body;
  const value = parseFloat(amount);

  if (!recipientAccountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  try {
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

    // Create debit & credit transaction logs
    await db.Transaction.create({
      userId: req.user.id,
      type: 'debit',
      amount: value,
      reference: uuidv4(),
      description: `Transfer to ${recipientAccountNumber}`,
      status: 'success'
    });

    await db.Transaction.create({
      userId: recipientWallet.userId,
      type: 'credit',
      amount: value,
      reference: uuidv4(),
      description: `Received from ${senderWallet.accountNumber}`,
      status: 'success'
    });

    res.status(200).json({ message: 'Transfer successful', senderBalance: senderWallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};

// 🏦 External bank transfer using Flutterwave
exports.transferToBank = async (req, res) => {
  const { bankCode, accountNumber, amount, narration } = req.body;
  const userId = req.user.id;
  const value = parseFloat(amount);

  if (!bankCode || !accountNumber || !value || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer data' });
  }

  try {
    const wallet = await db.Wallet.findOne({ where: { userId } });

    if (!wallet || wallet.balance < value) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct balance upfront
    wallet.balance -= value;
    await wallet.save();

    const payload = {
      account_bank: bankCode,
      account_number: accountNumber,
      amount: value,
      narration: narration || 'ModernPay bank payout',
      currency: 'NGN',
      callback_url: 'https://webhook.site/test-callback', // Update with your webhook
      debit_currency: 'NGN'
    };

    const flutterwaveRes = await axios.post(
      'https://api.flutterwave.com/v3/transfers',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = flutterwaveRes.data;

    if (result.status === 'success') {
      await db.Transaction.create({
        userId,
        type: 'debit',
        amount: value,
        reference: result.data?.reference || uuidv4(),
        description: `Bank transfer to ${accountNumber}`,
        status: 'success'
      });

      return res.status(200).json({ message: 'Transfer successful', data: result.data });
    } else {
      // Refund wallet if Flutterwave failed
      wallet.balance += value;
      await wallet.save();

      return res.status(500).json({ message: 'Flutterwave transfer failed', error: result.message });
    }

  } catch (err) {
    return res.status(500).json({ message: 'Bank transfer error', error: err.message });
  }
};
