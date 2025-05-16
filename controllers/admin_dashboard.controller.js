const db = require('../models');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const totalWallets = await db.Wallet.count();
    const totalLoans = await db.Loan.count();
    const pendingKYCs = await db.KYCDocument.count({ where: { status: 'pending' } });

    res.status(200).json({
      users: totalUsers,
      wallets: totalWallets,
      loans: totalLoans,
      pendingKyc: pendingKYCs
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

exports.getPendingKyc = async (req, res) => {
  try {
    const kycs = await db.KYCDocument.findAll({
      where: { status: 'pending' },
      include: [{ model: db.User }],
      order: [['submittedAt', 'DESC']]
    });

    res.status(200).json({ kycs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch KYC queue' });
  }
};
