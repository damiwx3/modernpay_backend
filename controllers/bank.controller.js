const { Bank } = require('../models');

// GET /api/bank/list
exports.getBankList = async (req, res) => {
  try {
    const banks = await Bank.findAll({
      where: { active: true },
      attributes: ['name', 'code'],
      order: [['name', 'ASC']]
    });
    res.status(200).json(banks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/bank/verify
exports.verifyAccountNumber = async (req, res) => {
  // You should integrate with a real bank verification API here.
  const { accountNumber, bankCode } = req.body;
  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: 'accountNumber and bankCode are required' });
  }
  // Example: always succeed for demo
  res.status(200).json({ accountName: 'Demo User' });
};
