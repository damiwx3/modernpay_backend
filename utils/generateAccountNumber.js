const db = require('../models');

/**
 * Generate a unique 10-digit account number
 * Format: Starts with 10, then random 8 digits (like 10XXXXXXXX)
 */
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    // Example: 10 + 8 random digits = 10XXXXXXXX
    accountNumber = '10' + Math.floor(10000000 + Math.random() * 90000000);

    // Check if it already exists in the Wallet table
    const wallet = await db.Wallet.findOne({ where: { accountNumber } });
    if (!wallet) exists = false;
  }

  return accountNumber.toString();
};

module.exports = generateAccountNumber;
