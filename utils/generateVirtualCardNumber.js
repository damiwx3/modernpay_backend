const generateVirtualCardNumber = () => {
  let cardNumber = '52'; // Example: Mastercard BIN prefix
  for (let i = 0; i < 14; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  return cardNumber;
};

module.exports = generateVirtualCardNumber;
