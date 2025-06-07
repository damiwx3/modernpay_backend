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
  try {
    const payload = req.body;
    console.log('VTPass Webhook received:', payload);

    // 1️⃣ Log the webhook event
    await db.WebhookLog.create({
      event: 'vtpass',
      reference: payload.request_id || payload.reference,
      status: payload.status || payload.code || 'received',
      payload: payload,
    });

    // 2️⃣ Extract reference/request_id and status
    const reference = payload.request_id || payload.reference;
    const status = payload.status || payload.code; // e.g. 'delivered', 'failed', '000', etc.

    if (!reference) {
      console.warn('No reference/request_id in VTPass webhook');
      return res.status(200).send('No reference');
    }

    // 3️⃣ Find the bill payment record
    const bill = await db.BillPayment.findOne({ where: { reference } });
    if (!bill) {
      console.warn('No BillPayment found for reference:', reference);
      return res.status(200).send('No matching bill');
    }

    // 4️⃣ Idempotency: Only update if not already final
    if (bill.status === 'success' || bill.status === 'failed') {
      return res.status(200).send('Already processed');
    }

    // 5️⃣ Determine new status
    let newStatus = 'failed';
    // VTPass may send 'delivered' or code '000' for success
    if (
      status === 'delivered' ||
      status === 'DELIVERED' ||
      status === '000' ||
      (payload.data && (payload.data.code === '000' || payload.data.status === 'delivered'))
    ) {
      newStatus = 'success';
    }

    // 6️⃣ Update bill payment
    bill.status = newStatus;
    bill.responseData = payload;
    bill.paidAt = newStatus === 'success' ? new Date() : null;
    await bill.save();

    console.log(`BillPayment ${reference} updated to ${newStatus}`);

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ VTPass Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};
// Add at the bottom of the file
exports.paystackWebhook = async (req, res) => {
  // Paystack sends events as POST JSON
  const event = req.body;
  // For security, verify the Paystack signature
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body)).digest('hex');
  if (req.headers['x-paystack-signature'] !== hash) {
    return res.status(401).send('Invalid signature');
  }

  // Only handle successful charge events for dedicated accounts
  if (event.event === 'charge.success' && event.data.status === 'success') {
    try {
      const accountNumber = event.data.metadata?.account_number || event.data.authorization?.receiver_bank_account_number;
      const amount = parseFloat(event.data.amount) / 100;
      const reference = event.data.reference;
      // Find the virtual account in your DB
      const virtualAccount = await db.VirtualAccount.findOne({ where: { accountNumber } });
      if (!virtualAccount) return res.status(404).send('Account not found');
      const userId = virtualAccount.userId;
      // Credit the user's wallet
      const wallet = await db.Wallet.findOne({ where: { userId } });
      wallet.balance = parseFloat(wallet.balance) + amount;
      await wallet.save();

      // Log transaction
      await db.Transaction.create({
        userId,
        type: 'credit',
        amount,
        reference,
        description: 'Wallet deposit via Paystack',
        status: 'success',
        category: 'Wallet Funding',
        senderName: event.data.customer?.first_name || null,
        senderAccountNumber: event.data.customer?.customer_code || null,
        recipientName: wallet.accountName || null,
        recipientAccount: wallet.accountNumber || null,
        bankName: event.data.authorization?.bank || null,
      });

      // Send notifications (implement these functions)
      sendInAppNotification(userId, `Wallet funded: ₦${amount} via Paystack`);
      sendEmail(userId, `Your wallet has been credited with ₦${amount}`);
      sendSMS(userId, `Your wallet has been credited with ₦${amount}`);

      return res.sendStatus(200);
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).send('Webhook processing failed');
    }
  }
  res.sendStatus(200);
};
