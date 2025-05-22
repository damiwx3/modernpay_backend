const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const path = req.originalUrl;

    await db.SecurityLog.create({
      userId,
      ipAddress,
      device: userAgent,
      action: `Accessed ${path}`
    });

    next();
  } catch (err) {
    console.error('Logging failed:', err.message);
    next(); // Proceed even if logging fails
  }
};