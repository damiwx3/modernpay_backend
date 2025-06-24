
const db = require('../models');
const ContributionCycle = db.ContributionCycle;
const ContributionPayment = db.ContributionPayment;
const ContributionMember = db.ContributionMember;
const PayoutOrder = db.PayoutOrder;

exports.getAllCycles = async (req, res) => {
  try {
    const cycles = await ContributionCycle.findAll();
    res.status(200).json({ cycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCycleById = async (req, res) => {
  try {
    const cycle = await ContributionCycle.findByPk(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    res.status(200).json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCycle = async (req, res) => {
  try {
    const { groupId, startDate, endDate, amount, payoutOrderType } = req.body;
    if (!groupId || !startDate || !amount) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Find the latest cycleNumber for this group
    const lastCycle = await ContributionCycle.findOne({
      where: { groupId },
      order: [['cycleNumber', 'DESC']]
    });
    const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;

    const cycle = await ContributionCycle.create({
      groupId,
      startDate,
      endDate,
      amount,
      status: 'open',
      cycleNumber: nextCycleNumber // <-- set cycleNumber here
    });

    if (payoutOrderType === 'rotational') {
      const members = await ContributionMember.findAll({ where: { groupId } });
      const shuffled = members.sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length; i++) {
        await PayoutOrder.create({
          cycleId: cycle.id,
          userId: shuffled[i].userId,
          order: i + 1,
          paid: false
        });
      }
    }
    res.status(201).json({ cycle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.makeContribution = async (req, res) => {
  try {
    const { cycleId, amount, txRef } = req.body;
    const userId = req.user.id;
    const cycle = await ContributionCycle.findByPk(cycleId);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    const now = new Date();
    if (now < new Date(cycle.startDate) || now > new Date(cycle.endDate)) {
      return res.status(403).json({ message: 'Payment not within cycle window' });
    }

    const existing = await ContributionPayment.findOne({ where: { cycleId, userId } });
    if (existing) return res.status(409).json({ message: 'You have already paid for this cycle' });

    await ContributionPayment.create({
      cycleId,
      userId,
      amount,
      status: 'success',
      paidAt: new Date(),
      txRef,
      isAutoPaid: false
    });

    res.status(200).json({ message: 'Payment recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getCyclePayments = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch all payments for this cycle, including user info if available
    const payments = await db.ContributionPayment.findAll({
      where: { cycleId: id },
      include: [
        {
          model: db.User,
          as: 'User',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }
      ],
      order: [['paidAt', 'DESC']]
    });
    res.status(200).json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.closeCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await ContributionCycle.findByPk(id);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    const payments = await ContributionPayment.findAll({ where: { cycleId: id, status: 'success' } });
    const members = await ContributionMember.findAll({ where: { groupId: cycle.groupId } });

    if (payments.length < members.length) {
      return res.status(400).json({ message: 'Not all members have paid yet' });
    }

    const payout = await PayoutOrder.findOne({
      where: { cycleId: id, paid: false },
      order: [['order', 'ASC']]
    });
    if (!payout) return res.status(400).json({ message: 'All payouts already completed' });

    const alreadyPaid = await PayoutOrder.findOne({
      where: { cycleId: id, userId: payout.userId, paid: true }
    });
    if (alreadyPaid) return res.status(409).json({ message: 'Duplicate payout attempt' });

    payout.paid = true;
    payout.paidAt = new Date();
    await payout.save();

    cycle.status = 'completed';
    await cycle.save();

    res.json({ message: 'Cycle closed and payout released' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
