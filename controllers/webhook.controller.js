const db = require('../models');

exports.flutterwaveWebhook = async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers['verif-hash'];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ message: 'Invalid or missing webhook signature' });
  }

  const payload = req.body;

  try {
    if (payload.event === 'transfer.completed') {
      const data = payload.data;
      const { status, reference, amount } = data;

      const txn = await db.Transaction.findOne({ where: { description: reference } });

      if (!txn) return res.status(404).json({ message: 'Transaction not found' });

      if (status === 'SUCCESSFUL') {
        await txn.update({ status: 'success' });
        console.log(`✅ Payout successful: ${reference}`);
      } else if (status === 'FAILED') {
        const wallet = await db.Wallet.findOne({ where: { userId: txn.userId } });
        if (wallet) {
          wallet.balance += parseFloat(amount);
          await wallet.save();
        }
        await txn.update({ status: 'failed' });
        console.log(`❌ Payout failed and refunded: ${reference}`);
      }
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};
