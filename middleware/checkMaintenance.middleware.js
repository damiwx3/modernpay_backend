// middleware/checkMaintenance.middleware.js
const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const setting = await db.SystemSetting.findOne({ where: { key: 'maintenance_mode' } });

    if (setting && setting.value === 'on' && !req.admin) {
      return res.status(503).json({ message: 'App is under maintenance. Please try again later.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: 'Maintenance check failed', error: err.message });
  }
};