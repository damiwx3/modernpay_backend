// utils/generateVirtualCardNumber.js
function generateCardNumber() {
  const bin = '419999'; // Common test BIN for Visa
  let card = bin;
  for (let i = 0; i < 10; i++) {
    card += Math.floor(Math.random() * 10);
  }
  return card;
}

function generateExpiryDate() {
  const now = new Date();
  const year = now.getFullYear() + 4;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  return `${month}/${String(year).slice(-2)}`;
}

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

function generateVirtualCard(fullName) {
  return {
    cardNumber: generateCardNumber(),
    expiryDate: generateExpiryDate(),
    cvv: generateCVV(),
    cardHolder: fullName,
    provider: 'Visa'
  };
}

module.exports = generateVirtualCard;