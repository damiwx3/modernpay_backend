const db = require('../models');
const crypto = require('crypto'); // Add this for signature verification

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

    // 3️⃣ Wallet Funding (charge.success)
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

    // 4️⃣ (Optional) Handle transfer/webhook events from Paystack if needed

    // Always respond 200 OK to prevent repeated webhook calls
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Paystack Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};
