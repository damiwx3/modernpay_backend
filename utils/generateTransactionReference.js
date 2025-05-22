const crypto = require('crypto');

const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4-char
  return `TRX-${timestamp}-${random}`;
};

module.exports = generateTransactionReference;
