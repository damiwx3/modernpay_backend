
const db = require('../models');
const { Op } = require('sequelize');

// ✅ Create a new contribution group
exports.createGroup = async (req, res) => {
  try {
    const {
      name,
      amountPerMember,
      frequency,
      payoutSchedule,
      description,
      maxMembers,
      isPublic,
      payoutOrderType
    } = req.body;

    if (!name || !amountPerMember) {
      return res.status(400).json({ message: 'Name and amountPerMember are required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }

    const group = await db.ContributionGroup.create({
      name,
      description: description || null,
      amountPerMember: parseFloat(amountPerMember),
      frequency,
      payoutSchedule,
      imageUrl,
      createdBy: req.user.id,
      maxMembers: maxMembers ? parseInt(maxMembers) : 10,
      status: 'active',
      isPublic: isPublic === 'true' || isPublic === true,
      payoutOrderType: payoutOrderType || 'random'
    });

    await db.ContributionMember.create({
      groupId: group.id,
      userId: req.user.id,
      isAdmin: true,
      joinedAt: new Date()
    });

    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Join a group by ID (via URL param)
exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;

    const existing = await db.ContributionMember.findOne({
      where: { groupId, userId }
    });

    if (existing) {
      return res.status(409).json({ message: 'Already a member of this group' });
    }

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const memberCount = await db.ContributionMember.count({ where: { groupId } });
    if (group.maxMembers && memberCount >= group.maxMembers) {
      return res.status(403).json({ message: 'Group has reached max capacity' });
    }

    await db.ContributionMember.create({
      groupId,
      userId,
      isAdmin: false,
      joinedAt: new Date()
    });

    res.status(200).json({ message: 'Successfully joined the group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all groups user belongs to
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await db.ContributionMember.findAll({ where: { userId } });

    const groupIds = memberships.map(m => m.groupId);
    const groups = await db.ContributionGroup.findAll({ where: { id: groupIds } });

    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.ContributionGroup.findByPk(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const members = await db.ContributionMember.findAll({
      where: { groupId: id },
      include: [{ model: db.User, attributes: ['id', 'fullName', 'email'] }]
    });

    res.status(200).json({ group, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
