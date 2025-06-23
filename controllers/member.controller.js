const db = require('../models');

// GET /api/members/:id/profile
exports.getMemberProfile = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await db.User.findByPk(memberId, {
      attributes: ['id', 'fullName', 'email', 'profileImage']
    });
    if (!member) return res.status(404).json({ message: 'User not found' });

    // Get contribution history
    const history = await db.ContributionPayment.findAll({
      where: { userId: memberId },
      include: [
        { model: db.ContributionCycle, attributes: ['cycleNumber'] }
      ],
      order: [['paidAt', 'DESC']]
    });

    const formattedHistory = history.map(h => ({
      cycleNumber: h.ContributionCycle?.cycleNumber,
      amount: h.amount,
      status: h.status,
      paidAt: h.paidAt
    }));

    res.json({ profile: member, history: formattedHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET /api/members/:id/profile
exports.getMemberProfile = async (req, res) => {
  // ...returns { profile, history }
};