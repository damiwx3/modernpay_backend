const axios = require('axios');

// GET /api/bank/list - Fetch banks from Paystack
exports.getBankList = async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.paystack.co/bank',
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    // Paystack returns { status, message, data: [banks] }
    const banks = response.data.data.map(bank => ({
      name: bank.name,
      code: bank.code
    }));
    res.status(200).json({ banks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch banks', details: err.message });
  }
};

// POST /api/bank/verify - Verify account number using Paystack
exports.verifyAccountNumber = async (req, res) => {
  const { account_number, bank_code } = req.body;
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'account_number and bank_code are required' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    console.log('Paystack response:', response.data); // <-- Add this

    if (response.data.status) {
      return res.status(200).json({ accountName: response.data.data.account_name });
    } else {
      return res.status(400).json({ error: 'Verification failed', details: response.data.message });
    }
  } catch (err) {
    console.error('Paystack verification error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Verification error', details: err.response?.data || err.message });
  }
};