const db = require('../models');

exports.applyForLoan = async (req, res) => {
  try {
    const { amount, interestRate, durationInMonths } = req.body;

    if (!amount || !interestRate || !durationInMonths) {
      return res.status(400).json({ message: 'All loan fields are required' });
    }

    const loan = await db.Loan.create({
      userId: req.user.id,
      amount,
      interestRate,
      durationInMonths,
      status: 'pending'
    });

    res.status(201).json({ message: 'Loan application submitted', loan });
  } catch (err) {
    res.status(500).json({ message: 'Loan request failed' });
  }
};

exports.getUserLoans = async (req, res) => {
  try {
    const loans = await db.Loan.findAll({ where: { userId: req.user.id } });
    res.status(200).json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const loan = await db.Loan.findByPk(req.params.id);
    if (!loan || loan.userId !== req.user.id) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.status(200).json({ loan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve loan' });
  }
};
