const db = require('../models');

exports.payBill = async (req, res) => {
  const { serviceType, amount } = req.body;
  const userId = req.user.id;

  if (!serviceType || !amount || isNaN(amount)) {
    return res.status(400).json({ message: 'Service type and valid amount are required' });
  }

  try {
    const reference = `BILL-${Date.now()}`;

    const payment = await db.BillPayment.create({
      userId,
      serviceType,
      amount: parseFloat(amount),
      reference,
      status: 'success'
    });

    res.status(201).json({ message: 'Bill payment successful', payment });
  } catch (err) {
    res.status(500).json({ message: 'Bill payment failed', error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await db.BillPayment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bill history', error: err.message });
  }
};
