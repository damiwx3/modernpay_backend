const db = require('../models');

// ✅ Get all transactions for logged-in user
exports.getUserTransactions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = await db.Transaction.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      total: result.count,
      page,
      totalPages: Math.ceil(result.count / limit),
      transactions: result.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// ✅ Create a manual transaction (for admin/testing/demo)
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, description, status } = req.body;

    if (!amount || !type || isNaN(amount)) {
      return res.status(400).json({ message: 'Amount (numeric) and type are required.' });
    }

    const txn = await db.Transaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: type.toLowerCase(), // debit or credit
      description: description || 'Manual transaction',
      status: status || 'pending', // Optional: pending, success, failed
    });

    res.status(201).json({ message: 'Transaction created successfully', txn });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};
