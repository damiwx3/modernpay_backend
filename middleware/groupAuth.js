const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is a member or admin of the group
    const member = await db.ContributionMember.findOne({
      where: { groupId, userId: req.user.id }
    });

    // Optionally, check if user is group admin (if you have a role field)
    // const isAdmin = member && member.role === 'admin';

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};