const db = require('../models');

exports.moniepointWebhook = async (req, res) => {
  const webhookSecret = process.env.MONIEPOINT_WEBHOOK_SECRET;
  const signature = req.headers['x-moniepoint-signature'] || req.headers['x-webhook-signature'];
  const payload = req.body;

  // 0️⃣ Verify Signature (adjust as per Moniepoint docs)
  if (webhookSecret && signature && signature !== webhookSecret) {
    return res.status(401).json({ message: 'Invalid or missing Moniepoint webhook signature' });
  }

  try {
    // 1️⃣ Log Webhook
    await db.WebhookLog.create({
      event: payload.event || payload.type || 'moniepoint',
      reference: payload.reference || payload.data?.reference,
      status: payload.status || payload.data?.status || 'received',
      payload,
    });

    // 2️⃣ Wallet Funding
    if (
      payload.status === 'SUCCESS' &&
      payload.amount &&
      payload.accountNumber
    ) {
      const account_number = payload.accountNumber;
      const amount = payload.amount;

      // Validate amount
      if (isNaN(amount) || Number(amount) <= 0) {
        console.warn('⚠️ Invalid amount in webhook:', amount);
        return res.status(400).json({ message: 'Invalid amount in webhook' });
      }

      const wallet = await db.Wallet.findOne({ where: { accountNumber: account_number } });
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

      // Prevent duplicate credit
      const exists = await db.Transaction.findOne({ where: { reference: payload.reference } });
      if (exists) return res.status(200).send('Already processed');

      await db.Transaction.create({
        userId: wallet.userId,
        type: 'credit',
        amount: parseFloat(amount),
        reference: payload.reference,
        description: 'Moniepoint wallet funding',
        status: 'success',
      });

      wallet.balance += parseFloat(amount);
      await wallet.save();

      console.log(`✅ Moniepoint wallet funded: ₦${amount} for ${account_number}`);
    }

    // 3️⃣ Bank Transfer Confirmation
    else if (
      payload.type === 'transfer.completed' &&
      typeof payload.reference !== 'undefined' &&
      typeof payload.status !== 'undefined'
    ) {
      const { reference, status, amount } = payload;

      // Validate amount
      if (isNaN(amount) || Number(amount) < 0) {
        console.warn('⚠️ Invalid amount in transfer webhook:', amount);
        return res.status(400).json({ message: 'Invalid amount in webhook' });
      }

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

    // Always respond 200 OK to prevent repeated webhook calls
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};
