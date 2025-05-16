const db = require('../models');

// ...existing code...

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, description } = req.body;

    if (!amount || !type || isNaN(amount)) {
      return res.status(400).json({ message: 'Amount (numeric) and type are required.' });
    }

    const txn = await db.Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: type.toLowerCase(), // debit or credit
      description: description || 'Manual transaction',
      status: 'pending', // Optional: default to pending unless used immediately
    });

    res.status(201).json({ message: 'Transaction created successfully', txn });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};
