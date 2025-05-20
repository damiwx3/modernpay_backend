const axios = require('axios');
const { Bank } = require('../models');

// GET /api/bank/list
exports.getBankList = async (req, res) => {
  try {
    const banks = await Bank.findAll({
      where: { active: true },
      attributes: ['name', 'code'],
      order: [['name', 'ASC']]
    });
    res.status(200).json(banks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/bank/verify
exports.verifyAccountNumber = async (req, res) => {
  // Use the correct parameter names for Flutterwave
  const { accountNumber, bankCode } = req.body;
  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: 'accountNumber and bankCode are required' });
  }

  try {
    const response = await axios.get(
      'https://api.flutterwave.com/v3/accounts/resolve',
      {
        params: {
          account_number: accountNumber, // <-- use underscore
          account_bank: bankCode         // <-- use underscore
        },
        headers: {
          Authorization: `Bearer YOUR_FLUTTERWAVE_SECRET_KEY` // <-- replace with your real key
        }
      }
    );

    if (response.data.status === 'success') {
      return res.status(200).json({ accountName: response.data.data.account_name });
    } else {
      return res.status(400).json({ error: 'Verification failed' });
    }
  } catch (err) {
    // Optionally log the error for debugging
    console.error('Flutterwave verification error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Verification error', details: err.message });
  }
};
