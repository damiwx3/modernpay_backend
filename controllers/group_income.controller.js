const db = require('../models');

exports.getGroupIncome = async (req, res) => {
  try {
    const { groupId } = req.params;
    const income = await db.GroupIncome.findAll({
      where: { groupId: Number(groupId) },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: db.ContributionCycle, as: 'cycle', attributes: ['id', 'cycleNumber'] }
      ],
      order: [['collectedAt', 'DESC']]
    });
    res.json({ income });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};