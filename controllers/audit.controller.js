const db = require('../models');

// Get all audit logs for the authenticated user, with more details
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.AuditLog.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'action',
        'description',
        'ipAddress',
        'userAgent',
        'status',
        'method',
        'endpoint',
        'metadata',
        'createdAt'
      ]
    });
    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
  }
};

// Optionally: Get a single audit log by ID (for admin or user detail view)
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await db.AuditLog.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }
    res.status(200).json({ log });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit log', error: err.message });
  }
};