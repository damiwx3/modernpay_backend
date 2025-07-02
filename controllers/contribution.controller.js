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
  const t = await db.sequelize.transaction();
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

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      logger.warn('Invalid group name');
      await t.rollback();
      return res.status(400).json({ message: 'Valid group name is required' });
    }
    if (!amountPerMember || isNaN(amountPerMember) || Number(amountPerMember) <= 0) {
      logger.warn('Invalid amountPerMember');
      await t.rollback();
      return res.status(400).json({ message: 'Valid amountPerMember is required' });
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
}, { transaction: t });

await db.ContributionMember.create({
  groupId: group.id,
  userId: req.user.id,
  isAdmin: true,
  joinedAt: new Date()
}, { transaction: t });

// ✅ Create the first cycle for the group
const now = new Date();
const endDate = calculateEndDate(now, frequency);
await db.ContributionCycle.create({
  groupId: group.id,
  startDate: now,
  endDate,
  amount: parseFloat(amountPerMember),
  status: 'open',
  cycleNumber: 1
}, { transaction: t });

await t.commit();
logger.info(`Group created: ${group.name} by user ${req.user.id}`);
return res.status(201).json({ group });
  } catch (err) {
    await t.rollback();
    logger.error('Error creating group:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Join a group by ID (via URL param)
exports.joinGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;

    const existing = await db.ContributionMember.findOne({
      where: { groupId, userId }
    });

    if (existing) {
      logger.warn(`User ${userId} already a member of group ${groupId}`);
      await t.rollback();
      return res.status(409).json({ message: 'Already a member of this group' });
    }

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) {
      logger.warn(`Group ${groupId} does not exist`);
      await t.rollback();
      return res.status(404).json({ message: 'Sorry, this group does not exist.' });
    }

    const memberCount = await db.ContributionMember.count({ where: { groupId } });
    if (group.maxMembers && memberCount >= group.maxMembers) {
      logger.warn(`Group ${groupId} at max capacity`);
      await t.rollback();
      return res.status(403).json({ message: 'Group has reached max capacity' });
    }

    await db.ContributionMember.create({
      groupId,
      userId,
      isAdmin: false,
      joinedAt: new Date()
    }, { transaction: t });

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

    await t.commit();
    logger.info(`User ${userId} joined group ${groupId}`);
    return res.status(200).json({ message: 'Successfully joined the group' });
  } catch (err) {
    await t.rollback();
    logger.error('Error joining group:', err);
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

    // Add membersCount to each group
    const groupsWithCounts = await Promise.all(groups.rows.map(async (g) => {
      const groupObj = g.toJSON();
      groupObj.membersCount = await db.ContributionMember.count({ where: { groupId: g.id } });
      return groupObj;
    }));

    logger.info(`Fetched groups for user ${userId}`);
    return res.status(200).json({
      groups: groupsWithCounts,
      total: groups.count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    logger.error('Error fetching user groups:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Get single group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.ContributionGroup.findByPk(id);
    if (!group) {
      logger.warn(`Group ${id} not found`);
      return res.status(404).json({ message: 'Sorry, this group does not exist.' });
    }

    const currentCycle = await db.ContributionCycle.findOne({
      where: { groupId: id, status: 'open' },
      order: [['cycleNumber', 'DESC']]
    });

    const members = await db.ContributionMember.findAll({
      where: { groupId: id },
      include: [{ model: db.User, as: 'user', attributes: ['fullName', 'id'] }]
    });

    // Add membersCount to group object
    const groupObj = group.toJSON();
    groupObj.currentCycleId = currentCycle ? currentCycle.id : null;
    groupObj.membersCount = members.length;

    logger.info(`Fetched details for group ${id}`);
    return res.status(200).json({
      group: groupObj,
      members
    });
  } catch (err) {
    logger.error('Error fetching group details:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Invite to group (by email or userId), using template
exports.inviteToGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId } = req.params;
    const { email, invitedUserId } = req.body;
    if (!email && !invitedUserId) {
      logger.warn('Invite missing email or invitedUserId');
      await t.rollback();
      return res.status(400).json({ message: 'Email or invitedUserId is required' });
    }

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) {
      logger.warn(`Group ${groupId} not found for invite`);
      await t.rollback();
      return res.status(404).json({ message: 'Sorry, this group does not exist.' });
    }

    const where = invitedUserId ? { groupId, invitedUserId } : { groupId, email };
    const existing = await db.ContributionInvite.findOne({ where });
    if (existing) {
      logger.warn(`User already invited to group ${groupId}`);
      await t.rollback();
      return res.status(409).json({ message: 'User already invited' });
    }

    await db.ContributionInvite.create({
      groupId,
      invitedBy: req.user.id,
      invitedUserId: invitedUserId || null,
      email: email || null,
      status: 'pending',
      invitedAt: new Date()
    }, { transaction: t });

    // Send notification if email is provided (template)
    if (email) {
      const subject = `You're invited to join the group "${group.name}" on ModernPay`;
      const html = renderTemplate('inviteEmail', {
        groupName: group.name,
        description: group.description || 'No description',
        amountPerMember: group.amountPerMember,
        inviteLink: `https://modernpay9ja.com/join-group?groupId=${groupId}`
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

    await t.commit();
    logger.info(`Invite sent for group ${groupId}`);
    return res.json({ success: true, message: 'Invite sent' });
  } catch (err) {
    await t.rollback();
    logger.error('Error sending invite:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const member = await db.ContributionMember.findOne({ where: { groupId, userId } });
    if (!member) {
      logger.warn(`User ${userId} not a member of group ${groupId}`);
      await t.rollback();
      return res.status(404).json({ message: 'You are not a member of this group' });
    }

    if (member.isAdmin) {
      logger.warn(`Admin ${userId} tried to leave group ${groupId}`);
      await t.rollback();
      return res.status(403).json({ message: 'Admins cannot leave the group. Please assign another admin before leaving.' });
    }

    await member.destroy({ transaction: t });

    await t.commit();
    logger.info(`User ${userId} left group ${groupId}`);
    return res.json({ success: true, message: 'You have left the group' });
  } catch (err) {
    await t.rollback();
    logger.error('Error leaving group:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await db.ContributionGroup.findByPk(groupId);
    if (!group) {
      logger.warn(`Group ${groupId} not found for update`);
      await t.rollback();
      return res.status(404).json({ message: 'Sorry, this group does not exist.' });
    }

    if (group.createdBy !== req.user.id) {
      logger.warn(`User ${req.user.id} not authorized to update group ${groupId}`);
      await t.rollback();
      return res.status(403).json({ message: 'Only the group creator can perform this action.' });
    }

    await group.update(updates, { transaction: t });

    await t.commit();
    logger.info(`Group ${groupId} updated by user ${req.user.id}`);
    return res.json({ success: true, message: 'Group updated', group });
  } catch (err) {
    await t.rollback();
    logger.error('Error updating group:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Payout history
exports.payoutHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const payouts = await db.PayoutOrder.findAll({
      where: { userId, status: 'paid' }, // <-- FIXED
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

    // Recent joins (NO alias for User/ContributionGroup)
    const joins = await db.ContributionMember.findAll({
      order: [['joinedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        { model: db.User, attributes: ['fullName'] }, // no 'as'
        { model: db.ContributionGroup, attributes: ['name'] } // no 'as'
      ]
    });
    joins.forEach(j => activities.push({
      type: 'join',
      title: `${j.User?.fullName ?? 'Someone'} joined ${j.ContributionGroup?.name ?? 'a group'}`,
      description: '',
      createdAt: j.joinedAt
    }));

    // Recent contributions (alias for user, NO alias for ContributionGroup)
    const payments = await db.ContributionPayment.findAll({
      where: { status: 'success' },
      order: [['paidAt', 'DESC']],
      limit: 10,
      include: [
        { model: db.User, as: 'user', attributes: ['fullName'] }, // must use 'as' here
        { model: db.ContributionCycle, include: [
            { model: db.ContributionGroup, attributes: ['name'] } // no 'as'
          ]
        }
      ]
    });
    payments.forEach(p => activities.push({
      type: 'contribution',
      title: `${p.user?.fullName ?? 'Someone'} made a contribution`,
      description: `To ${p.ContributionCycle?.ContributionGroup?.name ?? 'a group'}`,
      createdAt: p.paidAt
    }));

    // Recent cycle completions (NO alias for ContributionGroup)
    const cycles = await db.ContributionCycle.findAll({
      where: { status: 'completed' },
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        { model: db.ContributionGroup, attributes: ['name'] } // no 'as'
      ]
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
// Advanced Scheduler with force withdrawal for missed payments
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
            status: { [Op.notIn]: ['paid', 'missed', 'success'] }
          },
          transaction: t
        });
        const unpaidMemberIds = payments.map(p => p.memberId);

        const missedContributions = [];
        for (const member of members) {
          // If payment is missing or not paid/success
          const payment = await db.ContributionPayment.findOne({
            where: { cycleId: cycle.id, memberId: member.id },
            transaction: t
          });

          if (!payment || (payment.status !== 'success' && payment.status !== 'paid')) {
            // Try to auto-deduct from wallet
            const wallet = await db.Wallet.findOne({ where: { userId: member.userId }, transaction: t });
            if (wallet && wallet.balance >= group.amountPerMember) {
              wallet.balance -= group.amountPerMember;
              await wallet.save({ transaction: t });

              if (payment) {
                await payment.update({
                  status: 'success',
                  paidAt: now,
                  isAutoPaid: true
                }, { transaction: t });
              } else {
                await db.ContributionPayment.create({
                  memberId: member.id,
                  userId: member.userId,
                  cycleId: cycle.id,
                  amount: group.amountPerMember,
                  status: 'success',
                  paidAt: now,
                  isAutoPaid: true
                }, { transaction: t });
              }

              // Optionally, notify the user about auto-deduction
              const user = users.find(u => u.id === member.userId);
              if (user) {
                await sendNotification(
                  user,
                  '',
                  'Auto-Deduction for Missed Contribution',
                  { groupId: group.id, cycleId: cycle.id },
                  'autoDeducted',
                  { groupName: group.name, cycleNumber: cycle.cycleNumber }
                );
              }
            } else {
              // If still unpaid and cannot auto-deduct, mark as missed (if not already)
              if (payment && payment.status !== 'missed') {
                await payment.update({ status: 'missed', penalty: group.penaltyAmount || 0 }, { transaction: t });
              } else if (!payment) {
                await db.ContributionPayment.create({
                  memberId: member.id,
                  userId: member.userId,
                  cycleId: cycle.id,
                  amount: group.amountPerMember,
                  status: 'missed',
                  missedAt: now,
                  penalty: group.penaltyAmount || 0
                }, { transaction: t });
              }
              missedContributions.push({
                memberId: member.id,
                userId: member.userId,
                cycleId: cycle.id,
                reason: 'Missed payment deadline',
                missedAt: now
              });
              missedPayments++;
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
          status: { [Op.in]: ['paid', 'missed', 'success'] }
        },
        transaction: t
      });

      if (payments.length === members.length) {
        await cycle.update({ status: 'closed', closedAt: now }, { transaction: t });
        adminSummary.push(`Closed cycle ${cycle.cycleNumber} for group "${group.name}"`);

        // FIX: Use status instead of paid
        const payoutOrder = await db.PayoutOrder.findOne({
          where: { cycleId: cycle.id, status: { [Op.ne]: 'paid' } }, // <-- FIXED
          transaction: t
        });
        if (payoutOrder) {
          await payoutOrder.update({ status: 'paid', paidAt: now }, { transaction: t }); // <-- FIXED
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
            status: 'pending' // <-- FIXED
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
    const groupId = req.query.groupId;
    const where = groupId ? { groupId } : {};

    const totalContributions = await db.ContributionPayment.sum('amount', { where: { ...where, status: 'success' } });

    const topContributor = await db.User.findOne({
      include: [{
        model: db.ContributionPayment,
        as: 'contributionPayments',
        where: { ...where, status: 'success' }
      }],
      order: [
        [db.Sequelize.literal('(SELECT SUM(amount) FROM "ContributionPayments" WHERE "ContributionPayments"."userId" = "User"."id"' + (groupId ? ` AND "ContributionPayments"."groupId" = ${groupId}` : '') + ')'), 'DESC']
      ]
    });

    const cycles = await db.ContributionCycle.count({ where: { ...where, status: 'completed' } });

    // Trend calculation
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setDate(now.getDate() - 30);
    const prevMonth = new Date(now);
    prevMonth.setDate(now.getDate() - 60);

    const lastMonthSum = await db.ContributionPayment.sum('amount', {
      where: {
        ...where,
        status: 'success',
        paidAt: { [db.Sequelize.Op.gte]: lastMonth }
      }
    });
    const prevMonthSum = await db.ContributionPayment.sum('amount', {
      where: {
        ...where,
        status: 'success',
        paidAt: {
          [db.Sequelize.Op.gte]: prevMonth,
          [db.Sequelize.Op.lt]: lastMonth
        }
      }
    });

    let trend = '-';
    if (lastMonthSum > prevMonthSum) trend = 'Upward';
    else if (lastMonthSum < prevMonthSum) trend = 'Downward';
    else if (lastMonthSum === prevMonthSum && lastMonthSum !== 0) trend = 'Stable';

    res.json({
      totalContributions: totalContributions || 0,
      topContributor: topContributor ? topContributor.fullName : '-',
      trend,
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

// ===== FIXED: ACTIVITY FEED ALIAS USAGE =====
exports.getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const activities = [];

    // Recent joins (NO alias for User/ContributionGroup)
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

    // Recent contributions (alias for user, NO alias for ContributionGroup)
    const payments = await db.ContributionPayment.findAll({
      where: { status: 'success' },
      order: [['paidAt', 'DESC']],
      limit: 10,
      include: [
        { model: db.User, as: 'user', attributes: ['fullName'] },
        { model: db.ContributionCycle, include: [
            { model: db.ContributionGroup, attributes: ['name'] }
          ]
        }
      ]
    });
    payments.forEach(p => activities.push({
      type: 'contribution',
      title: `${p.user?.fullName ?? 'Someone'} made a contribution`,
      description: `To ${p.ContributionCycle?.ContributionGroup?.name ?? 'a group'}`,
      createdAt: p.paidAt
    }));

    // Recent cycle completions (NO alias for ContributionGroup)
    const cycles = await db.ContributionCycle.findAll({
      where: { status: 'completed' },
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        { model: db.ContributionGroup, attributes: ['name'] }
      ]
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
exports.getContributionSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.query.groupId || req.params.groupId;

    // Total contributed by user (successful only)
    const totalContributed = await db.ContributionPayment.sum('amount', {
      where: {
        userId,
        status: 'success',
        ...(groupId ? { groupId } : {})
      }
    });

    // Total received by user (from payouts)
    const totalReceived = await db.PayoutOrder.sum('amount', {
      where: {
        userId,
        status: 'paid',
        ...(groupId ? { groupId } : {})
      }
    });

    // Groups joined
    const groupsJoined = await db.ContributionMember.count({
      where: { userId }
    });

    // Recent cycles the user contributed to
    const recentPayments = await db.ContributionPayment.findAll({
      where: {
        userId,
        status: 'success',
        ...(groupId ? { groupId } : {})
      },
      include: [{ model: db.ContributionCycle, attributes: ['cycleNumber'] }],
      order: [['paidAt', 'DESC']],
      limit: 5
    });

    const recentCycles = recentPayments
      .map(p => p.ContributionCycle)
      .filter(c => !!c)
      .map(c => ({ cycleNumber: c.cycleNumber }));

    res.json({
      totalContributed: totalContributed || 0,
      totalReceived: totalReceived || 0,
      groupsJoined: groupsJoined || 0,
      recentCycles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};