const db = require('../models');
const { Op } = require('sequelize');

// 🔁 Manual trigger for cron job
exports.runScheduler = async (req, res) => {
  try {
    const scheduler = require('../jobs/contributionScheduler');
    scheduler(true); // trigger manually
    res.status(200).json({ message: 'Scheduler triggered manually' });
  } catch (err) {
    res.status(500).json({ message: 'Scheduler failed', error: err.message });
  }
};

// 💸 Payout logic (e.g., to next person in group)
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

// 📊 Summary of a group
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
