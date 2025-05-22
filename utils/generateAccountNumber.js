const db = require('../models');

/**
 * Generate a unique 10-digit account number based on user's phone number.
 * Format: 10 + last 8 digits of phone number (e.g., 10XXXXXXXX)
 */
const generateAccountNumber = async (phoneNumber) => {
  // Remove non-digits and get last 8 digits
  const digits = phoneNumber.replace(/\D/g, '');
  const last8 = digits.slice(-8);

  let accountNumber = '10' + last8;

  // Ensure uniqueness in Wallet table
  let exists = await db.Wallet.findOne({ where: { accountNumber } });
  let counter = 0;
  while (exists) {
    // If exists, increment last digit(s) until unique
    counter++;
    accountNumber = '10' + (parseInt(last8) + counter).toString().padStart(8, '0');
    exists = await db.Wallet.findOne({ where: { accountNumber } });
  }

  return accountNumber;
};

module.exports = generateAccountNumber;