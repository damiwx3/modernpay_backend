const db = require('../models');

exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline } = req.body;

    const goal = await db.SavingsGoal.create({
      userId: req.user.id,
      title,
      targetAmount,
      savedAmount: 0,
      deadline
    });

    res.status(201).json({ message: 'Savings goal created', goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create goal' });
  }
};

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

exports.depositToGoal = async (req, res) => {
  try {
    const { goalId, amount } = req.body;

    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    const goal = await db.SavingsGoal.findByPk(goalId);

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    goal.savedAmount += parseFloat(amount);
    await goal.save();

    res.status(200).json({ message: 'Deposit successful', newSaved: goal.savedAmount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to deposit to goal' });
  }
};

exports.withdrawFromGoal = async (req, res) => {
  try {
    const { goalId, amount } = req.body;

    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });
    const goal = await db.SavingsGoal.findByPk(goalId);

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    if (goal.savedAmount < amount) {
      return res.status(400).json({ message: 'Insufficient savings' });
    }

    goal.savedAmount -= amount;
    await goal.save();

    wallet.balance += parseFloat(amount);
    await wallet.save();

    res.status(200).json({ message: 'Withdrawal successful', newWalletBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to withdraw from goal' });
  }
};
