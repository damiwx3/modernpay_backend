const db = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('../utils/sendNotification');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const sendPush = require('../utils/sendPush');
const { renderTemplate } = require('../utils/notificationTemplates');

// For logging (replace with your logger if you have one)
const logger = console;

// Helper to calculate endDate based on frequency (default 30 days)
function calculateEndDate(startDate, frequency) {
  const date = new Date(startDate);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  else if (frequency === 'biweekly') date.setDate(date.getDate() + 14);
  else if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else date.setDate(date.getDate() + 30); // default 30 days
  return date;
}

// Create a new contribution group
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
      payoutOrderType,
      penaltyAmount
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
      payoutOrderType: payoutOrderType || 'random',
      penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : 0
    });

    await db.ContributionMember.create({
      groupId: group.id,
      userId: req.user.id,
      isAdmin: true,
      joinedAt: new Date()
    });

    return res.status(201).json({ group });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Join a group by ID (via URL param)
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
    if (!group) return res.status(404).json({ message: 'Sorry, this group does not exist.' });

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

    // Notify group admin(s) using template
    const admins = await db.ContributionMember.findAll({ where: { groupId, isAdmin: true } });
    const adminUsers = await db.User.findAll({ where: { id: admins.map(a => a.userId) } });
    await sendNotification.sendBatchNotification(
      adminUsers,
      '',
      'New Member Joined',
      { groupId },
      'groupJoinNotification',
      { groupName: group.name, memberName: req.user.fullName }
    );

    return res.status(200).json({ message: 'Successfully joined the group' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Get all groups user belongs to (with pagination)
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const memberships = await db.ContributionMember.findAll({ where: { userId } });

    const groupIds = memberships.map(m => m.groupId);
    const groups = await db.ContributionGroup.findAndCountAll({
      where: { id: groupIds },
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      groups: groups.rows,
      total: groups.count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Get single group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.ContributionGroup.findByPk(id);
    if (!group) return res.status(404).json({ message: 'Sorry, this group does not exist.' });

    const members = await db.ContributionMember.findAll({
      where: { groupId: id },
      include: [{ model: db.User, attributes: ['id', 'fullName', 'email'] }]
    });

    return res.status(200).json({ group, members });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Invite to group (by email or userId), using template
exports.inviteToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email, invitedUserId } = req.body;
    if (!email && !invitedUserId) return res.status(400).json({ message: 'Email or invitedUserId is required' });

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Sorry, this group does not exist.' });

    const where = invitedUserId ? { groupId, invitedUserId } : { groupId, email };
    const existing = await db.ContributionInvite.findOne({ where });
    if (existing) return res.status(409).json({ message: 'User already invited' });

    await db.ContributionInvite.create({
      groupId,
      invitedBy: req.user.id,
      invitedUserId: invitedUserId || null,
      email: email || null,
      status: 'pending',
      invitedAt: new Date()
    });

    // Send notification if email is provided (template)
    if (email) {
      const subject = `You're invited to join the group "${group.name}" on ModernPay`;
      const html = renderTemplate('inviteEmail', {
        groupName: group.name,
        description: group.description || 'No description',
        amountPerMember: group.amountPerMember,
        inviteLink: `https://modernpayfinance.com/join-group?groupId=${groupId}`
      });
      await sendEmail({
        to: email,
        subject,
        html,
        text: `You have been invited to join the group "${group.name}" on ModernPay.`
      });
    }

    // Optionally, send in-app notification if invitedUserId is present (template)
    if (invitedUserId) {
      const invitedUser = await db.User.findByPk(invitedUserId);
      if (invitedUser) {
        await sendNotification(
          invitedUser,
          '',
          `You've been invited to join "${group.name}"`,
          { groupId },
          'inviteInApp',
          { groupName: group.name }
        );
      }
    }

    return res.json({ success: true, message: 'Invite sent' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const member = await db.ContributionMember.findOne({ where: { groupId, userId } });
    if (!member) return res.status(404).json({ message: 'You are not a member of this group' });

    if (member.isAdmin) return res.status(403).json({ message: 'Admins cannot leave the group. Please assign another admin before leaving.' });

    await member.destroy();

    return res.json({ success: true, message: 'You have left the group' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Sorry, this group does not exist.' });

    if (group.createdBy !== req.user.id) return res.status(403).json({ message: 'Only the group creator can perform this action.' });

    await group.update(updates);

    return res.json({ success: true, message: 'Group updated', group });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Payout history
exports.payoutHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const payouts = await db.PayoutOrder.findAll({
      where: { userId, paid: true },
      include: [
        { model: db.ContributionCycle, include: [{ model: db.ContributionGroup }] }
      ],
      order: [['paidAt', 'DESC']]
    });
    return res.json({ success: true, payouts });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/contributions/activity-feed (with pagination)
exports.getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const activities = [];

    // Recent joins
    const joins = await db.ContributionMember.findAll({
      order: [['joinedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        { model: db.User, attributes: ['fullName'] },
        { model: db.ContributionGroup, attributes: ['name'] }
      ]
    });
    joins.forEach(j => activities.push({
      type: 'join',
      title: `${j.User?.fullName ?? 'Someone'} joined ${j.ContributionGroup?.name ?? 'a group'}`,
      description: '',
      createdAt: j.joinedAt
    }));

    // Recent contributions
    const payments = await db.ContributionPayment.findAll({
      where: { status: 'success' },
      order: [['paidAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        { model: db.User, attributes: ['fullName'] },
        { model: db.ContributionCycle, include: [{ model: db.ContributionGroup, attributes: ['name'] }] }
      ]
    });
    payments.forEach(p => activities.push({
      type: 'contribution',
      title: `${p.User?.fullName ?? 'Someone'} made a contribution`,
      description: `To ${p.ContributionCycle?.ContributionGroup?.name ?? 'a group'}`,
      createdAt: p.paidAt
    }));

    // Recent cycle completions
    const cycles = await db.ContributionCycle.findAll({
      where: { status: 'completed' },
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [{ model: db.ContributionGroup, attributes: ['name'] }]
    });
    cycles.forEach(c => activities.push({
      type: 'cycle_complete',
      title: `Cycle completed for ${c.ContributionGroup?.name ?? 'a group'}`,
      description: '',
      createdAt: c.updatedAt
    }));

    // Sort all activities by date descending
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ activities, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Advanced Scheduler with transaction, templates and bulk user fetch
exports.runScheduler = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const groups = await db.ContributionGroup.findAll({ where: { status: 'active' }, transaction: t });
    let processed = 0, newCycles = 0, missedPayments = 0;
    let adminSummary = [];

    for (const group of groups) {
      const cycle = await db.ContributionCycle.findOne({
        where: { groupId: group.id, status: 'open' },
        transaction: t
      });
      if (!cycle) continue;

      const members = await db.ContributionMember.findAll({ where: { groupId: group.id }, transaction: t });
      const memberIds = members.map(m => m.id);
      const userIds = members.map(m => m.userId);
      const users = await db.User.findAll({ where: { id: userIds }, transaction: t });

      // 3. Check for missed payments (deadline passed and not paid)
      const now = new Date();
      const paymentDeadline = cycle.endDate || calculateEndDate(cycle.startDate, group.frequency);
      if (now > paymentDeadline) {
        const payments = await db.ContributionPayment.findAll({
          where: {
            cycleId: cycle.id,
            memberId: memberIds,
            status: { [Op.notIn]: ['paid', 'missed'] }
          },
          transaction: t
        });
        const unpaidMemberIds = payments.map(p => p.memberId);

        const missedContributions = [];
        for (const member of members) {
          if (unpaidMemberIds.includes(member.id)) {
            missedContributions.push({
              memberId: member.id,
              userId: member.userId,
              cycleId: cycle.id,
              reason: 'Missed payment deadline',
              missedAt: now
            });
            missedPayments++;
            const payment = payments.find(p => p.memberId === member.id);
            if (payment) {
              await payment.update({ status: 'missed', penalty: group.penaltyAmount || 0 }, { transaction: t });
            }
            // Notify member (all channels, template)
            const user = users.find(u => u.id === member.userId);
            if (user) {
              await sendNotification(
                user,
                '',
                'Missed Contribution',
                { groupId: group.id, cycleId: cycle.id },
                'missedPayment',
                { groupName: group.name, cycleNumber: cycle.cycleNumber }
              );
            }
          }
        }
        if (missedContributions.length) {
          await db.MissedContribution.bulkCreate(missedContributions, { transaction: t });
        }
      }

      // 4. Check if all members have paid or missed
      const payments = await db.ContributionPayment.findAll({
        where: {
          cycleId: cycle.id,
          memberId: memberIds,
          status: { [Op.in]: ['paid', 'missed'] }
        },
        transaction: t
      });

      if (payments.length === members.length) {
        await cycle.update({ status: 'closed', closedAt: now }, { transaction: t });
        adminSummary.push(`Closed cycle ${cycle.cycleNumber} for group "${group.name}"`);

        const payoutOrder = await db.PayoutOrder.findOne({
          where: { cycleId: cycle.id, paid: false },
          transaction: t
        });
        if (payoutOrder) {
          await payoutOrder.update({ paid: true, paidAt: now }, { transaction: t });
          const user = users.find(u => u.id === payoutOrder.userId);
          if (user) {
            await sendNotification(
              user,
              '',
              'Payout Received',
              { groupId: group.id, cycleId: cycle.id },
              'payoutReceived',
              { groupName: group.name, cycleNumber: cycle.cycleNumber }
            );
          }
        }

        // 7. Start a new cycle if group is still active and cycles remain
        const totalCycles = group.totalCycles || members.length;
        const nextCycleNumber = cycle.cycleNumber + 1;
        if (nextCycleNumber <= totalCycles) {
          let nextPayoutUserId;
          if (group.payoutOrderType === 'custom') {
            const nextOrder = await db.PayoutOrder.findOne({
              where: { groupId: group.id, cycleNumber: nextCycleNumber },
              transaction: t
            });
            nextPayoutUserId = nextOrder ? nextOrder.userId : null;
          } else {
            nextPayoutUserId = members[(nextCycleNumber - 1) % members.length].userId;
          }

          const newCycle = await db.ContributionCycle.create({
            groupId: group.id,
            cycleNumber: nextCycleNumber,
            startDate: now,
            endDate: calculateEndDate(now, group.frequency),
            amount: group.amountPerMember,
            status: 'open'
          }, { transaction: t });

          await db.PayoutOrder.create({
            groupId: group.id,
            cycleId: newCycle.id,
            userId: nextPayoutUserId,
            cycleNumber: nextCycleNumber,
            paid: false
          }, { transaction: t });

          const newPayments = members.map(member => ({
            memberId: member.id,
            cycleId: newCycle.id,
            amount: group.amountPerMember,
            status: 'pending'
          }));
          await db.ContributionPayment.bulkCreate(newPayments, { transaction: t });

          // Notify all members about new cycle (template)
          await sendNotification.sendBatchNotification(
            users,
            '',
            'New Cycle Started',
            { groupId: group.id, cycleId: newCycle.id },
            'newCycle',
            { groupName: group.name, cycleNumber: nextCycleNumber }
          );
          adminSummary.push(`Started new cycle ${nextCycleNumber} for group "${group.name}"`);
          newCycles++;
        }
        processed++;
      }
    }

    // Notify admins (configurable, template)
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@modernpayfinance.com'];
    const summaryMsg = renderTemplate('schedulerSummary', {
      processed,
      newCycles,
      missedPayments,
      details: adminSummary
    });
    await sendEmail({
      to: adminEmails,
      subject: 'ModernPay Contribution Scheduler Summary',
      html: summaryMsg,
      text: summaryMsg.replace(/<br>/g, '\n')
    });

    await t.commit();
    logger.info('Scheduler ran', { processed, newCycles, missedPayments });
    return res.json({
      success: true,
      message: `Scheduler ran. Closed ${processed} cycle(s), started ${newCycles} new cycle(s), marked ${missedPayments} missed payment(s).`
    });
  } catch (err) {
    await t.rollback();
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Add contribution contact
exports.addContributionContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactUserId } = req.body;
    if (!contactUserId) return res.status(400).json({ message: 'contactUserId is required' });

    const existing = await db.ContributionContact.findOne({ where: { userId, contactUserId } });
    if (existing) return res.status(409).json({ message: 'Contact already added' });

    const contact = await db.ContributionContact.create({
      userId,
      contactUserId,
      addedAt: new Date()
    });

    return res.json({ success: true, contact });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err.message });
  }
};
exports.getAnalytics = async (req, res) => {
  try {
    // Example analytics logic
    const totalContributions = await db.ContributionPayment.sum('amount', { where: { status: 'success' } });
    const topContributor = await db.User.findOne({
      include: [{
        model: db.ContributionPayment,
        where: { status: 'success' }
      }],
      order: [[db.Sequelize.literal('(SELECT SUM(amount) FROM ContributionPayments WHERE ContributionPayments.userId = User.id)'), 'DESC']]
    });
    const cycles = await db.ContributionCycle.count({ where: { status: 'completed' } });
    // You can add more analytics as needed

    res.json({
      totalContributions: totalContributions || 0,
      topContributor: topContributor ? topContributor.fullName : '-',
      trend: '-', // Add your trend logic if needed
      cycles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await db.ContributionSetting.findOne({ where: { userId } });
    res.json(settings || { notifications: true, autoPay: false, reminderFrequency: 'Weekly' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, autoPay, reminderFrequency } = req.body;
    let settings = await db.ContributionSetting.findOne({ where: { userId } });
    if (settings) {
      await settings.update({ notifications, autoPay, reminderFrequency });
    } else {
      settings = await db.ContributionSetting.create({ userId, notifications, autoPay, reminderFrequency });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};