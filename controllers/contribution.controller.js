const db = require('../models');
const { Op } = require('sequelize');

// Create a new contribution group
exports.createGroup = async (req, res) => {
  try {
    const { name, amountPerMember, frequency, payoutSchedule, description, maxMembers } = req.body;

    if (!name || !amountPerMember) {
      return res.status(400).json({ message: 'Name and amountPerMember are required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Or use Cloudinary URL if you're uploading there
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
      status: 'active'
    });

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ message: 'Create group failed', error: err.message });
  }
};

// Join a contribution group
exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const existing = await db.ContributionMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (existing) return res.status(400).json({ message: 'Already joined' });

    const member = await db.ContributionMember.create({
      userId: req.user.id,
      groupId
    });
    res.status(200).json({ message: 'Joined group', member });
  } catch (err) {
    res.status(500).json({ message: 'Join failed', error: err.message });
  }
};

// Make a contribution (stub)
exports.makeContribution = async (req, res) => {
  res.status(200).json({ message: 'makeContribution not implemented' });
};

// Leave a group (stub)
exports.leaveGroup = async (req, res) => {
  res.status(200).json({ message: 'leaveGroup not implemented' });
};

// Get all groups (stub)
exports.getGroups = async (req, res) => {
  try {
    const groups = await db.ContributionGroup.findAll();
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
};

// Get members of a group (stub)
exports.getMembers = async (req, res) => {
  try {
    const members = await db.ContributionMember.findAll({
      where: { groupId: req.params.groupId },
      include: [{ model: db.User, attributes: ['fullName', 'email'] }]
    });
    res.status(200).json({ members });
  } catch (err) {
    res.status(500).json({ message: 'Fetch members failed', error: err.message });
  }
};

// Run scheduler
exports.runScheduler = async (req, res) => {
  try {
    const scheduler = require('../jobs/contributionScheduler');
    scheduler(true); // trigger manually
    res.status(200).json({ message: 'Scheduler triggered manually' });
  } catch (err) {
    res.status(500).json({ message: 'Scheduler failed', error: err.message });
  }
};

// Process payout for a group
exports.processPayout = async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Custom logic: randomly pick or use cycleNumber to choose member
    const cycle = await db.ContributionCycle.findOne({
      where: { groupId, status: 'open' }
    });

    if (!cycle) return res.status(404).json({ message: 'No active cycle' });

    const members = await db.ContributionMember.findAll({ where: { groupId } });

    // For demo: Pick first member
    const winner = members[0];

    await db.ContributionPayment.create({
      memberId: winner.id,
      cycleId: cycle.id,
      amount: group.amountPerMember,
      status: 'paid',
      paidAt: new Date()
    });

    cycle.status = 'closed';
    await cycle.save();

    res.status(200).json({ message: `Payout sent to ${winner.id}` });
  } catch (err) {
    res.status(500).json({ message: 'Payout failed', error: err.message });
  }
};

// Get group summary
exports.getGroupSummary = async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const members = await db.ContributionMember.findAll({ where: { groupId } });
    const cycles = await db.ContributionCycle.findAll({ where: { groupId } });
    const payments = await db.ContributionPayment.findAll({
      where: { cycleId: { [Op.in]: cycles.map(c => c.id) } }
    });

    res.status(200).json({
      group,
      members,
      cycles,
      payments
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch summary', error: err.message });
  }
};
