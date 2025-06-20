const db = require('../models');
const { Op } = require('sequelize');

// Dashboard stats with more metrics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalWallets,
      totalLoans,
      pendingKYCs,
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      activeUsers
    ] = await Promise.all([
      db.User.count(),
      db.Wallet.count(),
      db.Loan.count(),
      db.KYCDocument.count({ where: { status: 'pending' } }),
      db.Transaction.count(),
      db.Transaction.sum('amount', { where: { type: 'deposit', status: 'success' } }),
      db.Transaction.sum('amount', { where: { type: 'withdrawal', status: 'success' } }),
      db.User.count({ where: { isActive: true } })
    ]);

    res.status(200).json({
      users: totalUsers,
      activeUsers,
      wallets: totalWallets,
      loans: totalLoans,
      pendingKyc: pendingKYCs,
      transactions: totalTransactions,
      totalDeposits: totalDeposits || 0,
      totalWithdrawals: totalWithdrawals || 0
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Audit logs with pagination and filtering
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, from, to } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }

    const { rows: logs, count } = await db.AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      logs,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// Pending KYC queue with pagination and search
exports.getPendingKyc = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, from, to } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'pending' };
    if (userId) where.userId = userId;
    if (from || to) {
      where.submittedAt = {};
      if (from) where.submittedAt[Op.gte] = new Date(from);
      if (to) where.submittedAt[Op.lte] = new Date(to);
    }

    const { rows: kycs, count } = await db.KYCDocument.findAndCountAll({
      where,
      include: [{ model: db.User }],
      order: [['submittedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      kycs,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Pending KYC error:', err);
    res.status(500).json({ message: 'Failed to fetch KYC queue' });
  }
};

/*
  NOTE: For security, ensure you use adminAuth middleware in your routes:
  router.get('/admin-dashboard/stats', adminAuth, adminDashboardController.getDashboardStats);
  router.get('/admin-dashboard/audit-logs', adminAuth, adminDashboardController.getAuditLogs);
  router.get('/admin-dashboard/pending-kyc', adminAuth, adminDashboardController.getPendingKyc);
*/