const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const setting = await db.SystemSetting.findOne({ where: { key: 'maintenance_mode' } });

    if (setting && setting.value === 'on') {
      return res.status(503).json({ message: 'System is under maintenance. Please try again later.' });
    }

    next();
  } catch (err) {
    console.error('Maintenance check failed:', err.message);
    res.status(500).json({ message: 'Error checking system status' });
  }
};