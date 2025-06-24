
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
    res.status(200).json({ cycle }); // <-- wrap in { cycle }
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
// const db = require('../models');
const Wallet = db.Wallet; // Make sure your Wallet model is loaded

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

    // Find the memberId for this user in this group
    const member = await ContributionMember.findOne({
      where: { userId, groupId: cycle.groupId }
    });
    if (!member) return res.status(400).json({ message: 'Member not found in group' });

    // 1. Check for late payment (after 24h from cycle start)
    const cycleStart = new Date(cycle.startDate);
    let penalty = 0;
    let penaltyToPlatform = 0;
    let penaltyToGroup = 0;
    let totalAmount = amount;

    if (now - cycleStart > 24 * 60 * 60 * 1000) {
      penalty = amount * 0.05;
      penaltyToPlatform = penalty / 2;
      penaltyToGroup = penalty / 2;
      totalAmount = amount + penalty;
    }

    // 2. Check wallet balance
    const wallet = await db.Wallet.findOne({ where: { userId } });
    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // 3. Deduct from wallet
    wallet.balance -= totalAmount;
    await wallet.save();

    // 4. Record payment
    await ContributionPayment.create({
      cycleId,
      userId,
      memberId: member.id,
      amount: amount,
      penalty: penalty,
      status: 'success',
      paidAt: now,
      txRef,
      isAutoPaid: false
    });

    // 5. Record penalty splits (pseudo-code, implement PlatformFee/GroupIncome models as needed)
    if (penalty > 0) {
      // Save platform fee
      if (db.PlatformFee) {
        await db.PlatformFee.create({
          cycleId,
          userId,
          amount: penaltyToPlatform,
          type: 'late',
          collectedAt: now
        });
      }
      // Save group fee (optionally, to a group wallet or income table)
      if (db.GroupIncome) {
        await db.GroupIncome.create({
          groupId: cycle.groupId,
          cycleId,
          amount: penaltyToGroup,
          type: 'late',
          collectedAt: now
        });
      }
    }

    res.status(200).json({
      message: penalty > 0
        ? `Payment recorded with late penalty. Wallet debited ${totalAmount} (${amount} + ${penalty} penalty)`
        : 'Payment recorded and wallet debited'
    });
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
          as: 'user',
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

    // --- 2% PLATFORM FEE LOGIC START ---
    const totalPool = cycle.amount * members.length;
    const platformFee = totalPool * 0.02;
    const payoutAmount = totalPool - platformFee;

    // Save platform fee (optional: create PlatformFee model/table)
    if (db.PlatformFee) {
      await db.PlatformFee.create({
        cycleId: cycle.id,
        amount: platformFee,
        type: 'cycle',
        collectedAt: new Date()
      });
    }
    // --- 2% PLATFORM FEE LOGIC END ---

    // Find the payout member's wallet
    const payoutWallet = await db.Wallet.findOne({ where: { userId: payout.userId } });
    if (!payoutWallet) return res.status(404).json({ message: 'Payout wallet not found for user' });

    // Add the payout amount (after fee) to the payout member's wallet
    payoutWallet.balance += payoutAmount;
    await payoutWallet.save();

    payout.paid = true;
    payout.paidAt = new Date();
    await payout.save();

    cycle.status = 'completed';
    await cycle.save();

    res.json({
      message: 'Cycle closed and payout released (2% platform fee deducted)',
      payoutUserId: payout.userId,
      payoutAmount,
      platformFee
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};