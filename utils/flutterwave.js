const axios = require('axios');

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

exports.initiatePayment = async ({ amount, email, tx_ref, currency = 'NGN' }) => {
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
};
