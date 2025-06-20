const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const generateCardNumber = require('../utils/generateVirtualCardNumber');

// Create a new virtual card
exports.createCard = async (req, res) => {
  try {
    const existing = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (existing) return res.status(400).json({ message: 'You already have a virtual card' });

    const { cardNumber, expiryDate, cvv, provider } = generateCardNumber(req.user.fullName);

    const card = await db.VirtualCard.create({
      userId: req.user.id,
      cardNumber,
      cardHolder: req.user.fullName,
      expiryDate,
      cvv,
      status: 'active',
      balance: 0,
      spendingLimit: null
    });

    res.status(201).json({ message: 'Virtual card created', card });
  } catch (err) {
    res.status(500).json({ message: 'Card creation failed', error: err.message });
  }
};

// Get the user's virtual card
exports.getCard = async (req, res) => {
  try {
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    res.status(200).json({ card });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch card', error: err.message });
  }
};

// Freeze or unfreeze the card
exports.toggleFreeze = async (req, res) => {
  try {
    const { action } = req.body;
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    if (action === 'freeze') card.status = 'frozen';
    else if (action === 'unfreeze') card.status = 'active';
    else return res.status(400).json({ message: 'Invalid action' });

    await card.save();
    res.status(200).json({ message: `Card ${action}d`, card });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update card status', error: err.message });
  }
};

// Get card transactions (with pagination)
exports.getCardTransactions = async (req, res) => {
  try {
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const txns = await db.Transaction.findAll({
      where: {
        userId: req.user.id,
        description: {
          [db.Sequelize.Op.like]: `%${card.cardNumber.slice(-4)}%`
        }
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.status(200).json(txns);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch transactions', error: err.message });
  }
};

// Top up the virtual card
exports.topUpCard = async (req, res) => {
  const { amount } = req.body;
  const value = parseFloat(amount);

  if (!value || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid top up amount' });
  }

  const t = await db.sequelize.transaction();
  try {
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id }, transaction: t });
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id }, transaction: t });

    if (!wallet || parseFloat(wallet.balance) < value) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    if (!card) {
      await t.rollback();
      return res.status(404).json({ message: 'No virtual card found' });
    }

    wallet.balance = parseFloat(wallet.balance) - value;
    card.balance = parseFloat(card.balance) + value;

    await wallet.save({ transaction: t });
    await card.save({ transaction: t });

    await db.Transaction.create({
      userId: req.user.id,
      type: 'debit',
      amount: value,
      reference: uuidv4(),
      description: 'Virtual Card Top Up',
      status: 'success',
    }, { transaction: t });

    await t.commit();

    res.status(200).json({ message: 'Card topped up', balance: card.balance, walletBalance: wallet.balance });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ message: 'Top up failed', error: err.message });
  }
};

// Set spending limit for the card
exports.setSpendingLimit = async (req, res) => {
  try {
    const { limit } = req.body;
    if (!limit || isNaN(limit) || limit <= 0) {
      return res.status(400).json({ message: 'Invalid spending limit' });
    }

    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    card.spendingLimit = parseFloat(limit);
    await card.save();

    res.status(200).json({ message: 'Spending limit set', spendingLimit: card.spendingLimit });
  } catch (err) {
    res.status(500).json({ message: 'Failed to set spending limit', error: err.message });
  }
};

// Delete the virtual card
exports.deleteCard = async (req, res) => {
  try {
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    await card.destroy();
    res.status(200).json({ message: 'Virtual card deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete card', error: err.message });
  }
};