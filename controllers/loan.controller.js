const db = require('../models');

exports.applyForLoan = async (req, res) => {
  try {
    const { amount, interestRate, durationInMonths, repaymentAmount, isAutoPayment } = req.body;

    if (!amount || !interestRate || !durationInMonths) {
      return res.status(400).json({ message: 'All loan fields are required' });
    }

    const loan = await db.Loan.create({
      userId: req.user.id,
      amount,
      interestRate,
      durationInMonths,
      repaymentAmount: repaymentAmount || null, // Optional, can be calculated later
      isAutoPayment: isAutoPayment || false,
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

// Add a repayment endpoint
exports.repayLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    const loan = await db.Loan.findByPk(req.params.id);

    if (!loan || loan.userId !== req.user.id) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.repaidAmount = Number(loan.repaidAmount) + Number(amount);
    await loan.save();

    res.status(200).json({ message: 'Repayment successful', loan });
  } catch (err) {
    res.status(500).json({ message: 'Repayment failed' });
  }
};

// Add an endpoint to toggle automatic payment
exports.toggleAutoPayment = async (req, res) => {
  try {
    const loan = await db.Loan.findByPk(req.params.id);

    if (!loan || loan.userId !== req.user.id) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.isAutoPayment = !loan.isAutoPayment;
    await loan.save();

    res.status(200).json({ message: `Automatic payment ${loan.isAutoPayment ? 'enabled' : 'disabled'}`, loan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update automatic payment setting' });
  }
};