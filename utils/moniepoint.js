const axios = require('axios');

const MONIEPOINT_API_KEY = process.env.MONIEPOINT_API_KEY;

// Get wallet balance
exports.getWalletBalance = async () => {
  try {
    const response = await axios.get(
      'https://api.moniepoint.com/v1/wallet/balance',
      {
        headers: { Authorization: `Bearer ${MONIEPOINT_API_KEY}` }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Create Virtual Account
exports.createVirtualAccount = async (user, bvnOrNin) => {
  try {
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bvn: bvnOrNin, // or use 'nin' if Moniepoint requires
      // Add other required fields as per Moniepoint docs
    };

    const response = await axios.post(
      'https://api.moniepoint.com/v1/virtual-accounts',
      payload,
      {
        headers: { Authorization: `Bearer ${MONIEPOINT_API_KEY}` }
      }
    );
    // Adjust the returned fields as per Moniepoint's response
    return {
      accountNumber: response.data.accountNumber,
      bankName: response.data.bankName || 'Moniepoint',
      ...response.data
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Transfer to bank
exports.transferToBank = async ({ bankCode, accountNumber, amount, narration }) => {
  try {
    const payload = {
      bankCode,
      accountNumber,
      amount,
      narration,
      currency: 'NGN'
    };
    const response = await axios.post(
      'https://api.moniepoint.com/v1/transfer',
      payload,
      {
        headers: { Authorization: `Bearer ${MONIEPOINT_API_KEY}` }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};