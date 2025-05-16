const db = require('../models');

exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, description } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required.' });
    }

    const txn = await db.Transaction.create({
      userId: req.user.id,
      amount,
      type,
      description
    });

    res.status(201).json({ message: 'Transaction created', txn });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};
