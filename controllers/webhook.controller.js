const db = require('../models');

exports.flutterwaveWebhook = async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  const payload = req.body;

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ message: 'Invalid or missing webhook signature' });
  }

  try {
    // 1️⃣ Handle incoming virtual account payments
    if (payload.event === 'charge.completed' && payload.data.payment_type === 'bank_transfer') {
      const data = payload.data;
      const accountNumber = data.account_number;
      const amount = parseFloat(data.amount);
      const reference = data.tx_ref || data.flw_ref;

      const wallet = await db.Wallet.findOne({ where: { accountNumber } });
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

      wallet.balance += amount;
      await wallet.save();

      await db.Transaction.create({
        userId: wallet.userId,
        type: 'credit',
        amount,
        reference,
        description: 'Virtual account funding',
        status: 'success',
      });

      console.log(`✅ Wallet credited via VA: ${accountNumber} - ₦${amount}`);
    }

    // 2️⃣ Handle outgoing bank transfer confirmations
    else if (payload.event === 'transfer.completed') {
      const data = payload.data;
      const { status, reference, amount } = data;

      const txn = await db.Transaction.findOne({ where: { reference } });
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
