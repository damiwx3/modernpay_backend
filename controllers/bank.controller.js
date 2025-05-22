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
  const { account_number, account_bank } = req.body;
  if (!account_number || !account_bank) {
    return res.status(400).json({ error: 'account_number and account_bank are required' });
  }

  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/accounts/resolve',
      {
        account_number,
        account_bank
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );

    if (response.data.status === 'success') {
      return res.status(200).json({ accountName: response.data.data.account_name });
    } else {
      return res.status(400).json({ error: 'Verification failed' });
    }
  } catch (err) {
    console.error('Flutterwave verification error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Verification error', details: err.message });
  }
};