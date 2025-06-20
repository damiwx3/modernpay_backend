const db = require('../models');

// Create a new savings goal
exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline } = req.body;

    const goal = await db.SavingsGoal.create({
      userId: req.user.id,
      title,
      targetAmount,
      savedAmount: 0,
      deadline,
      completed: false
    });

    res.status(201).json({ message: 'Savings goal created', goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create goal' });
  }
};

// Get all savings goals for the user
exports.getUserGoals = async (req, res) => {
  try {
    const goals = await db.SavingsGoal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ goals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve savings goals' });
  }
};

// Get a single savings goal by ID
exports.getGoalById = async (req, res) => {
  try {
    const goal = await db.SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.status(200).json({ goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve goal' });
  }
};

// Update a savings goal
exports.updateGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline } = req.body;
    const goal = await db.SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (title) goal.title = title;
    if (targetAmount) goal.targetAmount = targetAmount;
    if (deadline) goal.deadline = deadline;

    await goal.save();
    res.status(200).json({ message: 'Goal updated', goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update goal' });
  }
};

// Delete a savings goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await db.SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await goal.destroy();
    res.status(200).json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete goal' });
  }
};

// Mark a goal as completed
exports.completeGoal = async (req, res) => {
  try {
    const goal = await db.SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.completed = true;
    await goal.save();
    res.status(200).json({ message: 'Goal marked as completed', goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete goal' });
  }
};

// Deposit money from wallet to savings goal
exports.depositToGoal = async (req, res) => {
  try {
    const { goalId, amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    const goal = await db.SavingsGoal.findByPk(goalId);

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    await wallet.save();

    goal.savedAmount = parseFloat(goal.savedAmount) + parseFloat(amount);
    await goal.save();

    // Optional: Log transaction
    // await db.SavingsTransaction.create({ userId: req.user.id, goalId, type: 'deposit', amount });

    res.status(200).json({ message: 'Deposit successful', newSaved: goal.savedAmount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to deposit to goal' });
  }
};

// Withdraw money from savings goal to wallet
exports.withdrawFromGoal = async (req, res) => {
  try {
    const { goalId, amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    const goal = await db.SavingsGoal.findByPk(goalId);

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    if (parseFloat(goal.savedAmount) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient savings' });
    }

    goal.savedAmount = parseFloat(goal.savedAmount) - parseFloat(amount);
    await goal.save();

    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.save();

    // Optional: Log transaction
    // await db.SavingsTransaction.create({ userId: req.user.id, goalId, type: 'withdraw', amount });

    res.status(200).json({ message: 'Withdrawal successful', newWalletBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to withdraw from goal' });
  }
};