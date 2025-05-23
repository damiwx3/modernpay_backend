const axios = require('axios');

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_BASE_URL = 'https://api.monnify.com/api/v1';

async function getAccessToken() {
  const authRes = await axios.post(
    `${MONNIFY_BASE_URL}/auth/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64')}`,
      },
    }
  );
  return authRes.data.responseBody.accessToken;
}

async function createReservedAccount(user, accountReference) {
  const accessToken = await getAccessToken();
  const accountRes = await axios.post(
    `${MONNIFY_BASE_URL}/bank-transfer/reserved-accounts`,
    {
      accountReference,
      accountName: user.fullName || user.email,
      currencyCode: 'NGN',
      contractCode: process.env.MONNIFY_CONTRACT_CODE,
      customerEmail: user.email,
      customerName: user.fullName || user.email,
      getAllAvailableBanks: true
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return accountRes.data.responseBody.accounts[0];
}

module.exports = {
  getAccessToken,
  createReservedAccount,
};