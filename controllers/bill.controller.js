const db = require('../models');
const flutterwave = require('../utils/flutterwave');

// Purchase a bill (airtime, data, TV, etc.)
exports.payBill = async (req, res) => {
  const { serviceType, amount, recipient } = req.body;
  const userId = req.user.id;

  if (!serviceType || !amount || !recipient) {
    return res.status(400).json({ message: 'Service type, recipient, and amount are required' });
  }

  const reference = 'BILL-${Date.now()}';

  try {
    const payload = {
      country: 'NG',
      customer: recipient,
      amount,
      type: serviceType,
      reference,
    };

    const flwRes = await flutterwave.post('/bills', payload);
    const status = flwRes.data.status === 'success' ? 'success' : 'failed';

    await db.BillPayment.create({
      userId,
      serviceType,
      amount,
      reference,
      status,
    });

    return res.status(201).json({
      message: 'Bill payment processed',
      flutterwave: flwRes.data,
    });

  } catch (err) {
    console.error('Bill error:', err.message);
    return res.status(500).json({ message: 'Failed to process bill', error: err.message });
  }
};

// Fetch bill history
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

// Fetch available bill categories
exports.getCategories = async (req, res) => {
  try {
    const flwRes = await flutterwave.get('/bill-categories');
    res.status(200).json({ categories: flwRes.data.data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};
