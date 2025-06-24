const db = require('../models');

exports.getAllFees = async (req, res) => {
  try {
    const fees = await db.PlatformFee.findAll({ order: [['collectedAt', 'DESC']] });
    res.json({ fees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};