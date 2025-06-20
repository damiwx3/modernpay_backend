const axios = require('axios');

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

exports.transferToBank = async ({ bankCode, accountNumber, amount, narration, user }) => {
  const axios = require('axios');
  const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

  // Step 1: Initiate transfer
  const payload = {
    account_bank: bankCode,
    account_number: accountNumber,
    amount,
    narration,
    currency: 'NGN',
    reference: `TRF-${Date.now()}-${user.id}`,
    callback_url: 'https://your-callback-url.com/transfer-callback',
    debit_currency: 'NGN',
  };

  const response = await axios.post(
    'https://api.flutterwave.com/v3/transfers',
    payload,
    { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
  );

  return response.data.data; // Adjust as needed based on Flutterwave's response
};

exports.createVirtualAccount = async (user, bvnOrNin) => {
  const payload = {
    email: user.email,
    bvn: bvnOrNin,
    is_permanent: true,
    tx_ref: `VA-${Date.now()}-${user.id}`,
  };

  const response = await axios.post(
    'https://api.flutterwave.com/v3/virtual-account-numbers',
    payload,
    { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
  );

  // Adjust according to Flutterwave's actual response structure
  return {
    accountNumber: response.data.data.account_number,
    bankName: response.data.data.bank_name,
  };
};

exports.initiatePayment = async ({ amount, email, tx_ref, currency = 'NGN' }) => {
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency,
        redirect_url: 'https://modernpay-backend.onrender.com/payment-callback',
        customer: { email },
        customizations: { title: 'Wallet Funding' }
      },
      {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};