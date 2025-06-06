const db = require('../models');
const crypto = require('crypto');

// Paystack webhook handler
exports.paystackWebhook = async (req, res) => {
  // 1️⃣ Verify Paystack signature for security
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (req.headers['x-paystack-signature'] !== hash) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  try {
    // 2️⃣ Log Webhook
    await db.WebhookLog.create({
      event: event.event || 'paystack',
      reference: event.data?.reference,
      status: event.data?.status || 'received',
      payload: event,
    });

    // 3️⃣ Handle charge.success (Wallet Funding)
    if (
      event.event === 'charge.success' &&
      event.data.status === 'success' &&
      event.data.amount &&
      event.data.reference
    ) {
      const reference = event.data.reference;
      const amount = event.data.amount / 100; // Paystack sends amount in kobo
      const email = event.data.customer.email;

      // Find user by email (or use metadata for userId if you set it)
      const user = await db.User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const wallet = await db.Wallet.findOne({ where: { userId: user.id } });
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

      // Prevent duplicate credit
      const exists = await db.Transaction.findOne({ where: { reference } });
      if (exists) return res.status(200).send('Already processed');

      await db.Transaction.create({
        userId: wallet.userId,
        type: 'credit',
        amount: parseFloat(amount),
        reference: reference,
        description: 'Paystack wallet funding',
        status: 'success',
      });

      wallet.balance += parseFloat(amount);
      await wallet.save();

      console.log(`✅ Paystack wallet funded: ₦${amount} for ${email}`);
    }

    // 4️⃣ Handle charge.failed
    if (
      event.event === 'charge.failed' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'failed' },
        { where: { reference: event.data.reference } }
      );
      console.log(`❌ Paystack charge failed for reference: ${event.data.reference}`);
    }

    // 5️⃣ Handle transfer.success
    if (
      event.event === 'transfer.success' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'success' },
        { where: { reference: event.data.reference } }
      );
      console.log(`✅ Paystack transfer successful for reference: ${event.data.reference}`);
    }

    // 6️⃣ Handle transfer.failed
    if (
      event.event === 'transfer.failed' &&
      event.data.reference
    ) {
      // Optionally refund wallet here
      await db.Transaction.update(
        { status: 'failed' },
        { where: { reference: event.data.reference } }
      );
      console.log(`❌ Paystack transfer failed for reference: ${event.data.reference}`);
    }

    // 7️⃣ Handle transfer.reversed
    if (
      event.event === 'transfer.reversed' &&
      event.data.reference
    ) {
      // Optionally refund wallet here
      await db.Transaction.update(
        { status: 'reversed' },
        { where: { reference: event.data.reference } }
      );
      console.log(`↩️ Paystack transfer reversed for reference: ${event.data.reference}`);
    }

    // 8️⃣ Handle transfer.pending
    if (
      event.event === 'transfer.pending' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'pending' },
        { where: { reference: event.data.reference } }
      );
      console.log(`⏳ Paystack transfer pending for reference: ${event.data.reference}`);
    }

    // 9️⃣ Handle dedicatedaccount.credited (Virtual Account Funding)
    if (
      event.event === 'dedicatedaccount.credited' &&
      event.data.reference &&
      event.data.amount
    ) {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      const customer = event.data.customer;

      // Find user by virtual account or customer code
      const virtualAccount = await db.VirtualAccount.findOne({
        where: { accountNumber: event.data.account_number }
      });
      if (virtualAccount) {
        const user = await db.User.findOne({ where: { id: virtualAccount.userId } });
        const wallet = await db.Wallet.findOne({ where: { userId: user.id } });

        // Prevent duplicate credit
        const exists = await db.Transaction.findOne({ where: { reference } });
        if (!exists) {
          await db.Transaction.create({
            userId: wallet.userId,
            type: 'credit',
            amount: parseFloat(amount),
            reference: reference,
            description: 'Paystack virtual account funding',
            status: 'success',
          });

          wallet.balance += parseFloat(amount);
          await wallet.save();

          console.log(`✅ Virtual account funded: ₦${amount} for user ${user.email}`);
        }
      }
    }

    // Always respond 200 OK to prevent repeated webhook calls
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Paystack Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};

exports.vtpassWebhook = async (req, res) => {
  // VTPass will POST to this endpoint with payment status, etc.
  // You can log, verify, and update your DB as needed.
  console.log('VTPass Webhook received:', req.body);

  // TODO: Add your logic to update payment status, etc.

  res.status(200).send('Webhook received');
};
