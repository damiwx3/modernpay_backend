const db = require('../models');

exports.getUserActivities = async (req, res) => {
  try {
    const activities = await db.Activity.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};