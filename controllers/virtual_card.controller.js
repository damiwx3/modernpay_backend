const db = require('../models');
const generateCardNumber = require('../utils/generateVirtualCardNumber');

exports.createCard = async (req, res) => {
  try {
    const existing = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (existing) return res.status(400).json({ message: 'You already have a virtual card' });

    const generateCard = require('../utils/generateVirtualCardNumber');
    const { cardNumber, expiryDate, cvv, provider } = generateCard(req.user.fullName);

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

exports.getCard = async (req, res) => {
  try {
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    res.status(200).json({ card });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch card', error: err.message });
  }
};

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

exports.getCardTransactions = async (req, res) => {
  try {
    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    const txns = await db.Transaction.findAll({
      where: {
        userId: req.user.id,
        description: {
          [db.Sequelize.Op.like]: `%${card.cardNumber.slice(-4)}%`
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ transactions: txns });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch transactions', error: err.message });
  }
};

exports.topUpCard = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid top up amount' });
    }

    const card = await db.VirtualCard.findOne({ where: { userId: req.user.id } });
    if (!card) return res.status(404).json({ message: 'No virtual card found' });

    card.balance = (parseFloat(card.balance) || 0) + parseFloat(amount);
    await card.save();

    res.status(200).json({ message: 'Card topped up', balance: card.balance });
  } catch (err) {
    res.status(500).json({ message: 'Top up failed', error: err.message });
  }
};

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
