const db = require('../models');
const { Op } = require('sequelize');

// GET /api/missed-contributions
exports.getMissedContributions = async (req, res) => {
  try {
    const { userId, cycleId, groupId } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (cycleId) where.cycleId = cycleId;

    const include = [
      { model: db.User, attributes: ['id', 'fullName', 'email'] },
      { model: db.ContributionCycle, include: [{ model: db.ContributionGroup }] }
    ];

    const missed = await db.MissedContribution.findAll({ where, include });

    const filtered = groupId
      ? missed.filter((m) => m.ContributionCycle.ContributionGroup.id == groupId)
      : missed;

    res.status(200).json({ missedContributions: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
