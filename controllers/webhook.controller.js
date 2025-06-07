const db = require('../models');
const crypto = require('crypto');
const sendNotification = require('../utils/sendNotification');

// Paystack webhook handler
exports.paystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (req.headers['x-paystack-signature'] !== hash) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  let webhookLogId = null;
  let user = null;

  try {
    // Log Webhook (initial, may update later)
    let webhookLog = await db.WebhookLog.create({
      event: event.event || 'paystack',
      reference: event.data?.reference,
      status: event.data?.status || 'received',
      payload: event,
    });
    webhookLogId = webhookLog.id;

    // 1️⃣ Handle charge.success (Card/Bank Wallet Funding)
    if (
      event.event === 'charge.success' &&
      event.data.status === 'success' &&
      event.data.amount &&
      event.data.reference
    ) {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      const email = event.data.customer.email;

      user = await db.User.findOne({ where: { email } });
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

      // Update WebhookLog with userId
      await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

      // Notify user and update notificationSent
      try {
        await sendNotification(
          user,
          `Your wallet has been credited with ₦${amount}. Reference: ${reference}`,
          'Wallet Credit'
        );
        await db.WebhookLog.update({ notificationSent: true }, { where: { id: webhookLogId } });
      } catch (notifyErr) {
        await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
        console.error('Notification error:', notifyErr.message);
      }

      console.log(`✅ Paystack wallet funded: ₦${amount} for ${email}`);
    }

    // 2️⃣ Handle charge.failed (notify user)
    if (
      event.event === 'charge.failed' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'failed' },
        { where: { reference: event.data.reference } }
      );
      try {
        const email = event.data.customer?.email;
        if (email) {
          user = await db.User.findOne({ where: { email } });
          if (user) {
            await sendNotification(
              user,
              `Your wallet funding attempt failed. Reference: ${event.data.reference}`,
              'Wallet Funding Failed'
            );
            await db.WebhookLog.update(
              { userId: user.id, notificationSent: true },
              { where: { id: webhookLogId } }
            );
          }
        }
      } catch (notifyErr) {
        await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
        console.error('Notification error:', notifyErr.message);
      }
      console.log(`❌ Paystack charge failed for reference: ${event.data.reference}`);
    }

    // 3️⃣ Handle transfer.success
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

    // 4️⃣ Handle transfer.failed (notify user)
    if (
      event.event === 'transfer.failed' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'failed' },
        { where: { reference: event.data.reference } }
      );
      try {
        const tx = await db.Transaction.findOne({ where: { reference: event.data.reference } });
        if (tx) {
          user = await db.User.findOne({ where: { id: tx.userId } });
          if (user) {
            await sendNotification(
              user,
              `Your transfer attempt failed. Reference: ${event.data.reference}`,
              'Transfer Failed'
            );
            await db.WebhookLog.update(
              { userId: user.id, notificationSent: true },
              { where: { id: webhookLogId } }
            );
          }
        }
      } catch (notifyErr) {
        await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
        console.error('Notification error:', notifyErr.message);
      }
      console.log(`❌ Paystack transfer failed for reference: ${event.data.reference}`);
    }

    // 5️⃣ Handle transfer.reversed (notify user)
    if (
      event.event === 'transfer.reversed' &&
      event.data.reference
    ) {
      await db.Transaction.update(
        { status: 'reversed' },
        { where: { reference: event.data.reference } }
      );
      try {
        const tx = await db.Transaction.findOne({ where: { reference: event.data.reference } });
        if (tx) {
          user = await db.User.findOne({ where: { id: tx.userId } });
          if (user) {
            await sendNotification(
              user,
              `A transfer was reversed. Reference: ${event.data.reference}`,
              'Transfer Reversed'
            );
            await db.WebhookLog.update(
              { userId: user.id, notificationSent: true },
              { where: { id: webhookLogId } }
            );
          }
        }
      } catch (notifyErr) {
        await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
        console.error('Notification error:', notifyErr.message);
      }
      console.log(`↩️ Paystack transfer reversed for reference: ${event.data.reference}`);
    }

    // 6️⃣ Handle transfer.pending
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

    // 7️⃣ Handle dedicatedaccount.credited (Virtual Account Funding)
    if (
      event.event === 'dedicatedaccount.credited' &&
      event.data.reference &&
      event.data.amount
    ) {
      const reference = event.data.reference;
      const amount = event.data.amount / 100;
      const accountNumber = event.data.account_number;

      const virtualAccount = await db.VirtualAccount.findOne({
        where: { accountNumber }
      });
      if (virtualAccount) {
        user = await db.User.findOne({ where: { id: virtualAccount.userId } });
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

          // Update WebhookLog with userId
          await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

          // Notify user and update notificationSent
          try {
            await sendNotification(
              user,
              `Your wallet has been credited with ₦${amount} via Virtual Account. Reference: ${reference}`,
              'Wallet Credit'
            );
            await db.WebhookLog.update({ notificationSent: true }, { where: { id: webhookLogId } });
          } catch (notifyErr) {
            await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
            console.error('Notification error:', notifyErr.message);
          }

          console.log(`✅ Virtual account funded: ₦${amount} for user ${user.email}`);
        }
      }
    }

    // Log unhandled events
    else {
      console.log('Unhandled Paystack event:', event.event);
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    if (webhookLogId) {
      await db.WebhookLog.update({ errorMessage: err.message }, { where: { id: webhookLogId } });
    }
    console.error('❌ Paystack Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};

exports.vtpassWebhook = async (req, res) => {
  let webhookLogId = null;
  try {
    const payload = req.body;
    console.log('VTPass Webhook received:', payload);

    // 1️⃣ Log the webhook event
    let webhookLog = await db.WebhookLog.create({
      event: 'vtpass',
      reference: payload.request_id || payload.reference,
      status: payload.status || payload.code || 'received',
      payload: payload,
    });
    webhookLogId = webhookLog.id;

    // 2️⃣ Extract reference/request_id and status
    const reference = payload.request_id || payload.reference;
    const status = payload.status || payload.code;

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

    // 7️⃣ Notify user about bill payment status (with extra details)
    try {
      const user = await db.User.findOne({ where: { id: bill.userId } });
      if (user) {
        let notifyMsg, notifyTitle;
        let details = '';
        if (bill.phone) details += `Phone: ${bill.phone}. `;
        if (bill.meterNumber) details += `Meter: ${bill.meterNumber}. `;
        if (newStatus === 'success') {
          notifyTitle = 'Bill Payment Successful';
          notifyMsg = `Your bill payment (${bill.type || 'service'}) of ₦${bill.amount} was successful. ${details}Reference: ${reference}`;
        } else {
          notifyTitle = 'Bill Payment Failed';
          notifyMsg = `Your bill payment (${bill.type || 'service'}) of ₦${bill.amount} failed. ${details}Reference: ${reference}`;
        }
        await sendNotification(user, notifyMsg, notifyTitle);
        await db.WebhookLog.update(
          { userId: user.id, notificationSent: true },
          { where: { id: webhookLogId } }
        );
      }
    } catch (notifyErr) {
      await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
      console.error('Notification error (VTPass):', notifyErr.message);
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    if (webhookLogId) {
      await db.WebhookLog.update({ errorMessage: err.message }, { where: { id: webhookLogId } });
    }
    console.error('❌ VTPass Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};
