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

    // Automatically add the creator as a member
    await db.ContributionMember.create({
      userId: req.user.id,
      groupId: group.id
    });

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ message: 'Create group failed', error: err.message });
  }
};

// In contribution.controller.js
exports.sendGroupInvite = async (req, res) => {
  try {
    const { groupId, invitedUserId } = req.body;
    const invite = await db.ContributionInvite.create({
      groupId,
      invitedBy: req.user.id,
      invitedUserId,
      status: 'pending'
    });
    res.status(201).json({ message: 'Invitation sent', invite });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send invite', error: err.message });
  }
};

exports.respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body; // 'accepted' or 'declined'
    const invite = await db.ContributionInvite.findByPk(inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    invite.status = action;
    await invite.save();
    if (action === 'accepted') {
      await db.ContributionMember.create({
        userId: invite.invitedUserId,
        groupId: invite.groupId
      });
    }
    res.status(200).json({ message: `Invite ${action}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to invite', error: err.message });
  }
};

exports.addContact = async (req, res) => {
  try {
    const { contactUserId } = req.body;
    const contact = await db.UserContact.create({
      userId: req.user.id,
      contactUserId
    });
    res.status(201).json({ message: 'Contact added', contact });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add contact', error: err.message });
  }
};

// Update a contribution group
exports.updateGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const updateFields = req.body;
    const updatedGroup = await db.ContributionGroup.updateGroup(groupId, updateFields);
    res.status(200).json({ message: 'Group updated successfully', group: updatedGroup });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

// ...existing code...

// Join a contribution group
exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if group is full
    const memberCount = await db.ContributionMember.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

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

// Make a contribution
exports.makeContribution = async (req, res) => {
  try {
    const { cycleId, amount } = req.body;
    const member = await db.ContributionMember.findOne({
      where: { userId: req.user.id }
    });
    if (!member) return res.status(404).json({ message: 'Not a group member' });

    const cycle = await db.ContributionCycle.findByPk(cycleId);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    // Optionally: check if already contributed
    const existing = await db.ContributionPayment.findOne({
      where: { memberId: member.id, cycleId }
    });
    if (existing) return res.status(400).json({ message: 'Already contributed for this cycle' });

    const payment = await db.ContributionPayment.create({
      memberId: member.id,
      cycleId,
      amount,
      status: 'paid',
      paidAt: new Date()
    });

    res.status(201).json({ message: 'Contribution made', payment });
  } catch (err) {
    res.status(500).json({ message: 'Contribution failed', error: err.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const member = await db.ContributionMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) return res.status(404).json({ message: 'Not a group member' });

    await member.destroy();
    res.status(200).json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Leave group failed', error: err.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await db.ContributionGroup.findAll();
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
};

// Get members of a group
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

    res.status(200).json({ message: `Payout sent to member ${winner.id}` });
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