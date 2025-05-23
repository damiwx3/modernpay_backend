const axios = require('axios');

// GET /api/bank/list - Fetch banks from Flutterwave
exports.getBankList = async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.flutterwave.com/v3/banks/NG',
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );
    const banks = response.data.data.map(bank => ({
      name: bank.name,
      code: bank.code
    }));
    res.status(200).json({ banks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch banks', details: err.message });
  }
};

// POST /api/bank/verify - Verify account number using Flutterwave
exports.verifyAccountNumber = async (req, res) => {
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
