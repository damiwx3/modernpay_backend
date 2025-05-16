const db = require('../models');

exports.buyAirtime = async (req, res) => {
  const { amount, phoneNumber, network } = req.body;

  try {
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    await db.BillPayment.create({
      userId: req.user.id,
      serviceType: 'airtime', // changed from service to serviceType
      phoneNumber,
      amount,
      provider: network,
      status: 'success'
    });

    res.status(200).json({ message: 'Airtime purchase successful' });
  } catch (err) {
    res.status(500).json({ message: 'Airtime purchase failed' });
  }
};

exports.buyData = async (req, res) => {
  const { amount, phoneNumber, network } = req.body;

  try {
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    await db.BillPayment.create({
      userId: req.user.id,
      serviceType: 'data', // changed from service to serviceType
      phoneNumber,
      amount,
      provider: network,
      status: 'success'
    });

    res.status(200).json({ message: 'Data bundle purchase successful' });
  } catch (err) {
    res.status(500).json({ message: 'Data bundle purchase failed' });
  }
};

exports.payElectricityBill = async (req, res) => {
  const { amount, meterNumber, disco } = req.body;

  try {
    const wallet = await db.Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    await db.BillPayment.create({
      userId: req.user.id,
      serviceType: 'electricity', // changed from service to serviceType
      meterNumber,
      provider: disco,
      amount,
      status: 'success'
    });

    res.status(200).json({ message: 'Electricity bill paid successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Electricity payment failed' });
  }
};

exports.getBillPaymentHistory = async (req, res) => {
  try {
    const bills = await db.BillPayment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ bills });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve bill history' });
  }
};