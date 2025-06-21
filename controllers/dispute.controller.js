const db = require('../models');

// User raises a dispute
exports.raiseDispute = async (req, res) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({ message: 'Transaction ID and reason are required' });
    }

    const transaction = await db.Transaction.findByPk(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const existing = await db.TransactionDispute.findOne({
      where: { transactionId, userId: req.user.id }
    });
    if (existing) return res.status(400).json({ message: 'Dispute already exists for this transaction' });

    const dispute = await db.TransactionDispute.create({
      transactionId,
      userId: req.user.id,
      reason
    });

    res.status(201).json({ message: 'Dispute raised', dispute });
  } catch (err) {
    res.status(500).json({ message: 'Failed to raise dispute', error: err.message });
  }
};

// Admin views all disputes
exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await db.TransactionDispute.findAll({
      include: [
        { model: db.User, attributes: ['id', 'fullName', 'email'] },
        { model: db.Transaction }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ disputes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load disputes', error: err.message });
  }
};

exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await db.TransactionDispute.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ disputes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your disputes', error: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const dispute = await db.TransactionDispute.findByPk(id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    dispute.status = status || 'resolved';
    await dispute.save();

    res.status(200).json({ message: 'Dispute resolved', dispute });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resolve dispute', error: err.message });
  }
};

// Admin resolves or updates dispute status
exports.updateDispute = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const dispute = await db.TransactionDispute.findByPk(id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    dispute.status = status || 'resolved';
    await dispute.save();

    res.status(200).json({ message: 'Dispute updated', dispute });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update dispute', error: err.message });
  }
};
exports.getUserDisputes = async (req, res) => {
  try {
    const disputes = await db.Dispute.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ disputes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDispute = async (req, res) => {
  try {
    const dispute = await db.Dispute.create({
      userId: req.user.id,
      reason: req.body.reason,
      status: 'Open'
    });
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};