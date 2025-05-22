const db = require('../models');

// Get all pending KYCs
exports.getPendingKyc = async (req, res) => {
  try {
    const docs = await db.KYCDocument.findAll({
      where: { status: 'pending' },
      include: [{ model: db.User, attributes: ['id', 'fullName', 'email'] }],
    });

    res.status(200).json({ pendingKyc: docs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load KYC queue', error: err.message });
  }
};

// Approve a KYC
exports.approveKyc = async (req, res) => {
  const { kycId } = req.params;

  try {
    const doc = await db.KYCDocument.findByPk(kycId);
    if (!doc) return res.status(404).json({ message: 'KYC document not found' });

    doc.status = 'approved';
    doc.rejectionReason = null;
    await doc.save();

    // Also update user status
    const user = await db.User.findByPk(doc.userId);
    if (user) {
      user.kycStatus = 'approved';
      await user.save();
    }

    res.status(200).json({ message: 'KYC approved', doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve KYC', error: err.message });
  }
};

// Reject a KYC
exports.rejectKyc = async (req, res) => {
  const { kycId } = req.params;
  const { reason } = req.body;

  try {
    const doc = await db.KYCDocument.findByPk(kycId);
    if (!doc) return res.status(404).json({ message: 'KYC document not found' });

    doc.status = 'rejected';
    doc.rejectionReason = reason || 'No reason provided';
    await doc.save();

    const user = await db.User.findByPk(doc.userId);
    if (user) {
      user.kycStatus = 'rejected';
      await user.save();
    }

    res.status(200).json({ message: 'KYC rejected', doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject KYC', error: err.message });
  }
};
