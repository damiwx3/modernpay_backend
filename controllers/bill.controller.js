const db = require('../models');
const axios = require('axios');

const FLW_BASE = 'https://api.flutterwave.com/v3';
const HEADERS = {
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json'
};

// List available bill categories from Flutterwave
exports.getCategories = async (req, res) => {
  try {
    const flutterRes = await axios.get(`${FLW_BASE}/bill-categories`, { headers: HEADERS });
    res.status(200).json({ categories: flutterRes.data.data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

// Airtime for Nigeria only (MTN, GLO, Airtel, 9mobile)
exports.getAirtimeCategories = async (req, res) => {
  try {
    const flutterRes = await axios.get(`${FLW_BASE}/bill-categories`, { headers: HEADERS });
    const allowed = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
    const airtime = flutterRes.data.data.filter(
      cat =>
        cat.country === 'NG' &&
        cat.biller_code &&
        cat.biller_code.toUpperCase().includes('AIRTIME') &&
        allowed.some(net => cat.name.toUpperCase().includes(net))
    );
    res.status(200).json({ categories: airtime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch airtime categories', error: err.message });
  }
};

// Data for Nigeria only (MTN, GLO, Airtel, 9mobile)
exports.getDataCategories = async (req, res) => {
  try {
    const flutterRes = await axios.get(`${FLW_BASE}/bill-categories`, { headers: HEADERS });
    const allowed = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
    const data = flutterRes.data.data.filter(
      cat =>
        cat.country === 'NG' &&
        cat.biller_code &&
        cat.biller_code.toUpperCase().includes('DATA') &&
        allowed.some(net => cat.name.toUpperCase().includes(net))
    );
    res.status(200).json({ categories: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch data categories', error: err.message });
  }
};

// Other Nigerian bills (excluding airtime/data)
exports.getNigerianBills = async (req, res) => {
  try {
    const flutterRes = await axios.get(`${FLW_BASE}/bill-categories`, { headers: HEADERS });
    const bills = flutterRes.data.data.filter(
      cat =>
        cat.country === 'NG' &&
        !(cat.biller_code && (cat.biller_code.toUpperCase().includes('AIRTIME') || cat.biller_code.toUpperCase().includes('DATA')))
    );
    res.status(200).json({ categories: bills });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch Nigerian bills', error: err.message });
  }
};

// All other bills (not Nigerian or not airtime/data)
exports.getOtherBills = async (req, res) => {
  try {
    const flutterRes = await axios.get(`${FLW_BASE}/bill-categories`, { headers: HEADERS });
    const bills = flutterRes.data.data.filter(
      cat =>
        cat.country !== 'NG' ||
        (
          cat.biller_code &&
          !cat.biller_code.toUpperCase().includes('AIRTIME') &&
          !cat.biller_code.toUpperCase().includes('DATA')
        )
    );
    res.status(200).json({ categories: bills });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch other bills', error: err.message });
  }
};

// ... (keep your other existing functions: validateCustomer, payBill, getHistory, getBundles)

// Validate customer (smartcard, phone, meter, etc.)
exports.validateCustomer = async (req, res) => {
  const { serviceType, customer } = req.body;

  if (!serviceType || !customer) {
    return res.status(400).json({ message: 'Service type and customer number are required' });
  }

  try {
    const response = await axios.post(
      `${FLW_BASE}/bill-items/validate`,
      {
        item_code: serviceType,
        code: customer,
        customer: customer
      },
      { headers: HEADERS }
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

    const flwRes = await axios.post(`${FLW_BASE}/bills`, payload, { headers: HEADERS });

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

// Get bundles (for data, TV, etc.)
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