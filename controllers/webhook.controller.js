const db = require('../models');

exports.flutterwaveWebhook = async (req, res) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  const payload = req.body;

  // 0️⃣ Verify Signature
  if (!signature || signature !== secretHash) {
    return res.status(401).json({ message: 'Invalid or missing webhook signature' });
  }

  try {
    const event = payload.event;
    const reference = payload.data?.tx_ref || payload.data?.flw_ref;

    // 1️⃣ Log Webhook
    await db.WebhookLog.create({
      event,
      reference,
      status: payload.data?.status || 'received',
      payload,
    });

    // 2️⃣ Virtual Account Wallet Funding
    if (event === 'charge.completed' && payload.data.payment_type === 'bank_transfer') {
      const { account_number, amount } = payload.data;

      const wallet = await db.Wallet.findOne({ where: { accountNumber: account_number } });
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

      // Prevent duplicate credit
      const exists = await db.Transaction.findOne({ where: { reference } });
      if (exists) return res.status(200).send('Already processed');

      await db.Transaction.create({
        userId: wallet.userId,
        type: 'credit',
        amount: parseFloat(amount),
        reference,
        description: 'Virtual account funding',
        status: 'success',
      });

      wallet.balance += parseFloat(amount);
      await wallet.save();

      console.log(`✅ Wallet funded: ₦${amount} for ${account_number}`);
    }

    // 3️⃣ Bank Transfer Confirmation
    else if (event === 'transfer.completed') {
      const { reference, status, amount } = payload.data;

      const txn = await db.Transaction.findOne({ where: { reference } });
      if (!txn) return res.status(404).json({ message: 'Transaction not found' });

      if (status === 'SUCCESSFUL') {
        await txn.update({ status: 'success' });
        console.log(`✅ Bank transfer confirmed: ${reference}`);
      } else if (status === 'FAILED') {
        const wallet = await db.Wallet.findOne({ where: { userId: txn.userId } });
        if (wallet) {
          wallet.balance += parseFloat(amount);
          await wallet.save();
        }
        await txn.update({ status: 'failed' });
        console.log(`❌ Transfer failed. Refunded: ${reference}`);
      }
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error', error: err.message });
  }
};