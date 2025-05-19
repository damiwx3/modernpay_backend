const db = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const generateReference = () => `BILL-${Date.now()}`;

// VTPass integration helper
const sendBillToVTPass = async ({ serviceID, phone, amount }) => {
  const payload = {
    request_id: generateReference(),
    serviceID,
    billersCode: phone,
    variation_code: '',
    amount,
    phone
  };

  const response = await axios.post('https://sandbox.vtpass.com/api/pay', payload, {
    headers: {
      apiKey: process.env.VTPASS_API_KEY,
      secretKey: process.env.VTPASS_SECRET_KEY,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

// 1️⃣ PAY BILL
exports.payBill = async (req, res) => {
  const { serviceType, amount, phone } = req.body;
  const userId = req.user.id;

  if (!serviceType || !amount || !phone || isNaN(amount)) {
    return res.status(400).json({ message: 'Service type, phone, and valid amount are required' });
  }

  const reference = generateReference();
  let status = 'pending';

  try {
    const result = await sendBillToVTPass({ serviceID: serviceType, phone, amount });

    if (result.response_description?.toLowerCase().includes('success')) {
      status = 'success';
    } else {
      status = 'failed';
    }

    const payment = await db.BillPayment.create({
      userId,
      serviceType,
      amount: parseFloat(amount),
      reference,
      status
    });

    // Log in Transactions
    await db.Transaction.create({
      userId,
      type: 'debit',
      amount,
      reference,
      description: `Bill payment: ${serviceType}`,
      status
    });

    return res.status(201).json({
      message: status === 'success' ? 'Bill payment successful' : 'Bill payment failed',
      status,
      payment
    });

  } catch (err) {
    console.error('❌ Bill payment error:', err.message);
    return res.status(500).json({ message: 'Bill payment error', error: err.message });
  }
};

// 2️⃣ HISTORY with FILTER
exports.getHistory = async (req, res) => {
  const { serviceType, startDate, endDate } = req.query;

  const where = { userId: req.user.id };
  if (serviceType) where.serviceType = serviceType;
  if (startDate && endDate) {
    where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  try {
    const history = await db.BillPayment.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bill history', error: err.message });
  }
};

// 3️⃣ RETRY by reusing same controller (frontend calls this again)
