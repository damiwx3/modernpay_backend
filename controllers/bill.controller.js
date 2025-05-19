const db = require('../models');
const axios = require('axios');

// List available bill categories from Flutterwave
exports.getCategories = async (req, res) => {
  try {
    const flutterRes = await axios.get('https://api.flutterwave.com/v3/bill-categories', {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    res.status(200).json({ categories: flutterRes.data.data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

// Validate customer (smartcard, phone, meter, etc.)
exports.validateCustomer = async (req, res) => {
  const { serviceType, customer } = req.body;

  if (!serviceType || !customer) {
    return res.status(400).json({ message: 'Service type and customer number are required' });
  }

  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/bill-items/validate',
      {
        item_code: serviceType,
        code: customer,
        customer: customer
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;

    if (result.status === 'success') {
      return res.status(200).json({ message: result.message, data: result.data });
    } else {
      return res.status(400).json({ message: result.message || 'Validation failed' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Validation error', error: err.message });
  }
};

// Pay a bill (Airtime, Data, Electricity, TV, etc.)
exports.payBill = async (req, res) => {
  const { serviceType, amount, customer } = req.body;

  if (!serviceType || !amount || !customer) {
    return res.status(400).json({ message: 'Service type, amount, and customer number are required' });
  }

  try {
    const reference = `BILL-${Date.now()}`;

    // Flutterwave request
    const payload = {
      country: "NG",
      customer,
      amount,
      recurrence: "ONCE",
      type: serviceType,
      reference
    };

    const flwRes = await axios.post('https://api.flutterwave.com/v3/bills', payload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const response = flwRes.data;
    const status = response.status === 'success' ? 'success' : 'failed';

    // Save record
    await db.BillPayment.create({
      userId: req.user.id,
      serviceType,
      amount,
      reference,
      status
    });

    res.status(201).json({
      message: response.message,
      status,
      data: response.data
    });

  } catch (err) {
    res.status(500).json({ message: 'Bill payment failed', error: err.message });
  }
};

// Fetch user bill history
exports.getHistory = async (req, res) => {
  try {
    const history = await db.BillPayment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history', error: err.message });
  }
};

// 5. Get bundles (for data, TV, etc.)
exports.getBundles = async (req, res) => {
  const billerCode = req.params.billerCode;

  if (!billerCode) {
    return res.status(400).json({ message: 'Biller code is required' });
  }

  try {
    const response = await axios.get(`${FLW_BASE}/bill-items?biller_code=${billerCode}`, {
      headers: HEADERS,
    });

    res.status(200).json({ bundles: response.data.data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load bundles', error: err.message });
  }
};
