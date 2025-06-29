const db = require('../models');
const ContributionCycle = db.ContributionCycle;
const ContributionPayment = db.ContributionPayment;
const ContributionMember = db.ContributionMember;
const PayoutOrder = db.PayoutOrder;
const Wallet = db.Wallet;

// Get all cycles (optionally by group)
exports.getAllCycles = async (req, res) => {
  try {
    const { groupId } = req.query;
    const where = groupId ? { groupId: Number(groupId) } : {};
    const cycles = await ContributionCycle.findAll({ where });
    res.status(200).json({ cycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get cycle by ID, including next payout recipient and payout amount
exports.getCycleById = async (req, res) => {
  try {
    const cycle = await ContributionCycle.findByPk(req.params.id, {
      include: [
        {
          model: db.ContributionMember,
          as: 'recipient',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'fullName'] }]
        }
      ]
    });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    // Calculate total amount (if not stored in the cycle)
    let totalAmount = cycle.totalAmount;
    if (!totalAmount) {
      const payments = await db.ContributionPayment.sum('amount', { where: { cycleId: cycle.id } });
      totalAmount = payments || 0;
    }

    // Find the next unpaid payout order for this cycle
    const nextPayout = await db.PayoutOrder.findOne({
      where: { cycleId: cycle.id, status: { [db.Sequelize.Op.ne]: 'paid' } },
      order: [['order', 'ASC']],
      include: [{ model: db.User, as: 'user', attributes: ['id', 'fullName'] }]
    });

    res.status(200).json({
      cycle: {
        ...cycle.toJSON(),
        totalAmount,
        nextPayoutRecipient: nextPayout
          ? {
              id: nextPayout.user?.id,
              fullName: nextPayout.user?.fullName,
              order: nextPayout.order
            }
          : null,
        payoutAmount: totalAmount // or use your payout calculation logic
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get the full payout order for a cycle
exports.getPayoutOrder = async (req, res) => {
  try {
    const { id } = req.params; // cycleId
    const orders = await db.PayoutOrder.findAll({
      where: { cycleId: id },
      order: [['order', 'ASC']],
      include: [{ model: db.User, attributes: ['id', 'fullName', 'email', 'profileImage'] }]
    });
    res.json({ payoutOrder: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new contribution cycle and payout order (rotational/random)
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
      cycleNumber: nextCycleNumber
    });

    // Always create payout order for all members
    const members = await ContributionMember.findAll({ where: { groupId } });
    let payoutOrderList = members;

    // Shuffle if rotational/random
    if (payoutOrderType === 'rotational' || payoutOrderType === 'random' || payoutOrderType === 'spin') {
      payoutOrderList = members.sort(() => Math.random() - 0.5);
    }

    for (let i = 0; i < payoutOrderList.length; i++) {
      await PayoutOrder.create({
        cycleId: cycle.id,
        userId: payoutOrderList[i].userId,
        groupId,
        order: i + 1,
        status: 'pending'
      });
    }

    res.status(201).json({ cycle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Make a contribution payment
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

// Get all payments for a cycle
exports.getCyclePayments = async (req, res) => {
  try {
    const { id } = req.params;
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

// Close a cycle and trigger payout (release to next in order)
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

    // Find the next unpaid payout order
    const payout = await PayoutOrder.findOne({
      where: { cycleId: id, status: { [db.Sequelize.Op.ne]: 'paid' } },
      order: [['order', 'ASC']]
    });
    if (!payout) return res.status(400).json({ message: 'All payouts already completed' });

    // --- 2% PLATFORM FEE LOGIC START ---
    const totalPool = cycle.amount * members.length;
    const platformFee = totalPool * 0.02;
    const payoutAmount = totalPool - platformFee;

    // Save platform fee
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

    payout.status = 'paid';
    payout.paidAt = new Date();
    await payout.save();

    // Only complete cycle if all payouts are done
    const unpaid = await PayoutOrder.count({ where: { cycleId: id, status: { [db.Sequelize.Op.ne]: 'paid' } } });
    if (unpaid === 0) {
      cycle.status = 'completed';
      await cycle.save();
    }

    res.json({
      message: 'Payout released (2% platform fee deducted)',
      payoutUserId: payout.userId,
      payoutAmount,
      platformFee
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// User spins for their payout order in a cycle
exports.spinForOrder = async (req, res) => {
  try {
    const { id } = req.params; // cycleId
    const userId = req.user.id;

    // Check if user already has a payout order for this cycle
    const existing = await db.PayoutOrder.findOne({ where: { cycleId: id, userId } });
    if (existing) {
      return res.status(400).json({ message: 'You have already spun for your position.' });
    }

    // Get all assigned orders for this cycle
    const assignedOrders = await db.PayoutOrder.findAll({
      where: { cycleId: id },
      attributes: ['order']
    });
    const assignedNumbers = assignedOrders.map(o => o.order);

    // Get total number of members in the group
    const cycle = await db.ContributionCycle.findByPk(id);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    const members = await db.ContributionMember.findAll({ where: { groupId: cycle.groupId } });
    const totalMembers = members.length;

    // Find available numbers (1...N)
    const availableNumbers = [];
    for (let i = 1; i <= totalMembers; i++) {
      if (!assignedNumbers.includes(i)) availableNumbers.push(i);
    }
    if (availableNumbers.length === 0) {
      return res.status(400).json({ message: 'All positions have been assigned.' });
    }

    // Randomly assign a number from availableNumbers
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const assignedOrder = availableNumbers[randomIndex];

    // Create the payout order for this user
    await db.PayoutOrder.create({
      cycleId: id,
      userId,
      groupId: cycle.groupId,
      order: assignedOrder,
      status: 'pending'
    });

    res.json({ message: 'Spin successful!', order: assignedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};