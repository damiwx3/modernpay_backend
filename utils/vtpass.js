const axios = require('axios');

const VTPASS_BASE = process.env.VTPASS_BASE || 'https://vtpass.com/api';
const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

console.log('VTPASS_API_KEY:', VTPASS_API_KEY);
console.log('VTPASS_PUBLIC_KEY:', VTPASS_PUBLIC_KEY);
console.log('VTPASS_SECRET_KEY:', VTPASS_SECRET_KEY);

const vtpassAxios = axios.create({
  baseURL: VTPASS_BASE,
  headers: {
    'Content-Type': 'application/json',
    'cache-control': 'no-cache'
  }
});

// Interceptor to set headers based on method
vtpassAxios.interceptors.request.use(config => {
  config.headers['api-key'] = VTPASS_API_KEY;
  if (config.method === 'get') {
    config.headers['public-key'] = VTPASS_PUBLIC_KEY;
    delete config.headers['secret-key'];
  } else {
    config.headers['secret-key'] = VTPASS_SECRET_KEY;
    delete config.headers['public-key'];
  }
  return config;
});

module.exports = vtpassAxios;