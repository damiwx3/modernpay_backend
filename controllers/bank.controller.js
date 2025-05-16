const axios = require('axios');

// ✅ Get list of Nigerian banks from Flutterwave
exports.getBankList = async (req, res) => {
  try {
    const response = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      }
    });

    const banks = response.data.data;
    res.status(200).json({ message: 'Banks fetched successfully', banks });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch bank list',
      error: err.response?.data?.message || err.message
    });
  }
};

// ✅ Resolve bank account number using Flutterwave
exports.verifyAccountNumber = async (req, res) => {
  const { account_number, bank_code } = req.body;

  if (!account_number || !bank_code) {
    return res.status(400).json({ message: 'account_number and bank_code are required' });
  }

  try {
    const response = await axios.get(`https://api.flutterwave.com/v3/accounts/resolve`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
      params: {
        account_number,
        account_bank: bank_code,
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      return res.status(200).json({
        message: 'Account verified successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({ message: 'Verification failed', error: result.message });
    }
  } catch (err) {
    return res.status(500).json({
      message: 'Flutterwave verification error',
      error: err.response?.data?.message || err.message,
    });
  }
};
