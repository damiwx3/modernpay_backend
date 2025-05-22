// middleware/securityLogger.js
const db = require('../models');

module.exports = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const device = req.headers['user-agent'] || 'Unknown';
  const action = req.method + ' ' + req.originalUrl;

  try {
    await db.SecurityLog.create({
      userId: req.user?.id || null,
      ipAddress: ip,
      device,
      action
    });
  } catch (err) {
    console.error('Failed to log security event:', err.message);
  }

  next();
};