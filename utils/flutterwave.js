const axios = require('axios');

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

const flutterwave = axios.create({
  baseURL: FLW_BASE_URL,
  headers: {
    Authorization: 'Bearer ${FLW_SECRET_KEY}',
    'Content-Type': 'application/json',
  }
});

module.exports = flutterwave;