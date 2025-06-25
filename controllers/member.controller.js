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

// GET /api/members?groupId=123
exports.listMembers = async (req, res) => {
  try {
    const { groupId } = req.query;
    if (groupId) {
      // Find all ContributionMembers for the group, include user info
      const members = await db.ContributionMember.findAll({
        where: { groupId },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }]
      });

      // Flatten user info for frontend
      const result = members.map(m => ({
        id: m.user.id,
        fullName: m.user.fullName,
        email: m.user.email,
        profileImage: m.user.profileImage,
      }));

      return res.json({ members: result });
    } else {
      // Return all users if no groupId is provided (original behavior)
      const members = await db.User.findAll({
        attributes: ['id', 'fullName', 'email', 'profileImage']
      });
      return res.json({ members });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};