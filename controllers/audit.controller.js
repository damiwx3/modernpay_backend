const db = require('../models');

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.AuditLog.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
  }
};