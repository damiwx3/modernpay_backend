const db = require('../models');
const crypto = require('crypto');
const sendNotification = require('../utils/sendNotification');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const { Op } = require('sequelize');

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

      // Extract sender name if available
      let senderName = '';
      if (event.data.customer && (event.data.customer.first_name || event.data.customer.last_name)) {
        senderName = `${event.data.customer.first_name || ''} ${event.data.customer.last_name || ''}`.trim();
      }
      let description = senderName
        ? `Transfer Recieved From ${senderName}`
        : 'ModernPay wallet funding';

       await db.Transaction.create({
        userId: wallet.userId,
        type: 'credit',
        amount: parseFloat(amount),
        reference: reference,
        description: description,
        status: 'success',
        senderName: senderName || null,
        senderBank: event.data.authorization?.bank || event.data.sender_bank || null,
        recipientName: senderName || null,
        recipientBank: event.data.recipient?.bank_name || null,
        category: 'wallet_funding'
      });

      console.log('Wallet balance before:', wallet.balance, 'Amount:', amount);
console.log('Type of wallet.balance:', typeof wallet.balance, 'Value:', wallet.balance);
console.log('Type of amount:', typeof amount, 'Value:', amount);

if (wallet.balance == null || isNaN(wallet.balance)) wallet.balance = 0;
wallet.balance = Number(wallet.balance) + Number(amount);

await wallet.save();
console.log('Wallet balance after:', wallet.balance);
      // Double-check balance in DB
      const freshWallet = await db.Wallet.findOne({ where: { userId: user.id } });
      console.log('Wallet balance in DB:', freshWallet.balance);

      // Update WebhookLog with userId
      await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

      // Log user data before notification
      console.log('User for notification:', {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        deviceToken: user.deviceToken
      });

      // Notify user and update notificationSent
      // Format/mask account number (adjust field as needed)
const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', {minimumFractionDigits: 2});
const maskedAcc = maskAccount(wallet.accountNumber || wallet.account_number || '');

// Compose alert message
const alertMsg =
  `Credit\n` +
  `Amt:${formatNaira(amount)}\n` +
  `Acc:${maskedAcc}\n` +
  `Desc:${reference}/ToModernPay/From/${senderName || 'Sender'}\n` +
  `Date:${new Date().toLocaleDateString('en-GB')}\n` +
  `Avail Bal:${formatNaira(wallet.balance)}\n`;

try {
  await sendNotification(
    user,
    alertMsg,
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
    // ...existing code...

// 3️⃣ Handle transfer.success
if (
  event.event === 'transfer.success' &&
  event.data.reference
) {
  await db.Transaction.update(
    { status: 'success' },
    { where: { reference: event.data.reference } }
  );
  // --- Debit Notification Block START ---
  const tx = await db.Transaction.findOne({ where: { reference: event.data.reference } });
  if (tx) {
    user = await db.User.findOne({ where: { id: tx.userId } });
    const wallet = await db.Wallet.findOne({ where: { userId: user.id } });
    if (user && wallet) {
      const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
      const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', {minimumFractionDigits: 2});
      const maskedAcc = maskAccount(wallet.accountNumber || wallet.account_number || '');
      // Use recipientName or recipient_account for recipient info
      const recipientInfo = tx.recipientName || tx.recipient_account || 'Recipient';
      const recipientBank = tx.recipientBank || '';
      const alertMsg =
        `Debit\n` +
        `Amt:${formatNaira(tx.amount)}\n` +
        `Acc:${maskedAcc}\n` +
        `Desc:${tx.reference}/${recipientInfo}${recipientBank ? '/' + recipientBank : ''}\n` +
        `Date:${new Date().toLocaleDateString('en-GB')}\n` +
        `Avail Bal:${formatNaira(wallet.balance)}\n`;
      try {
        await sendNotification(
          user,
          alertMsg,
          'Wallet Debit'
        );
        await db.WebhookLog.update({ notificationSent: true }, { where: { id: webhookLogId } });
      } catch (notifyErr) {
        await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
        console.error('Notification error:', notifyErr.message);
      }
    }
  }
  // --- Debit Notification Block END ---
  console.log(`✅ Paystack transfer successful for reference: ${event.data.reference}`);
}

// ...existing code...

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
          // Extract sender name from authorization or customer
          let senderName = '';
          if (event.data.authorization && event.data.authorization.sender_name) {
            senderName = event.data.authorization.sender_name;
          } else if (event.data.customer && (event.data.customer.first_name || event.data.customer.last_name)) {
            senderName = `${event.data.customer.first_name || ''} ${event.data.customer.last_name || ''}`.trim();
          }

          let description = senderName
            ? `Transfer from ${senderName}`
            : 'ModernPay account funding';

          await db.Transaction.create({
            userId: wallet.userId,
            type: 'credit',
            amount: parseFloat(amount),
            reference: reference,
            description: description,
            status: 'success',
            senderName: senderName || null,
            senderBank: event.data.sender_bank || null,
            recipientName: user.fullName || null,
            recipientBank: null,
            category: 'wallet_funding'
          });

          console.log('Wallet balance before:', wallet.balance, 'Amount:', amount);
console.log('Type of wallet.balance:', typeof wallet.balance, 'Value:', wallet.balance);
console.log('Type of amount:', typeof amount, 'Value:', amount);

if (wallet.balance == null || isNaN(wallet.balance)) wallet.balance = 0;
wallet.balance = Number(wallet.balance) + Number(amount);

await wallet.save();
console.log('Wallet balance after:', wallet.balance);
          // Double-check balance in DB
          const freshWallet = await db.Wallet.findOne({ where: { userId: user.id } });
          console.log('Wallet balance in DB:', freshWallet.balance);

          // Update WebhookLog with userId
          await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

          // Log user data before notification
          console.log('User for notification:', {
            id: user.id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            deviceToken: user.deviceToken
          });

          // Notify user and update notificationSent
          // Format/mask account number (adjust field as needed)
const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', {minimumFractionDigits: 2});
const maskedAcc = maskAccount(wallet.accountNumber || wallet.account_number || '');

// Compose alert message
const alertMsg =
  `Credit\n` +
  `Amt:${formatNaira(amount)}\n` +
  `Acc:${maskedAcc}\n` +
  `Desc:${reference}/ToModernPay/from/${senderName || 'Sender'}\n` +
  `Date:${new Date().toLocaleDateString('en-GB')}\n` +
  `Avail Bal:${formatNaira(wallet.balance)}\n`;

try {
  await sendNotification(
    user,
    alertMsg,
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

// VTPass webhook handler
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
        console.log('User for notification:', {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          deviceToken: user.deviceToken
        });
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
// Youverify webhook handler
exports.youverifyWebhook = async (req, res) => {
  const signature = req.headers['x-youverify-signature'];
  const secret = process.env.YOUVERIFY_WEBHOOK_KEY;
  console.log('Youverify webhook FULL payload:', JSON.stringify(req.body, null, 2));

  // Verify signature (recommended)
  if (signature && secret) {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (computed !== signature) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }
  }

  const { reference, status, type, data, event } = req.body;

  // Always check both top-level and nested fields
  const finalStatus = status || data?.status;
  const finalType = type || data?.type;

  // Try to get a reference from known places
  const ref =
    reference ||
    data?.reference ||
    data?.idNumber ||
    data?.parentId ||
    null;

  if (!ref) {
    console.error('❌ Youverify Webhook error: Missing reference/idNumber in payload', req.body);
    // Return 200 to avoid unnecessary retries from Youverify
    return res.status(200).json({ message: 'Event ignored: no reference/idNumber' });
  }

  try {
    // Try to find the KYC document by externalReferenceId or documentNumber
    const kycDoc = await db.KYCDocument.findOne({
      where: {
        [Op.or]: [
          { externalReferenceId: ref },
          { documentNumber: ref }
        ]
      }
    });
    if (!kycDoc) {
      return res.status(404).json({ message: 'KYC document not found' });
    }

    // Update KYC document status and response
    kycDoc.status = finalStatus || req.body.status || 'received';
    kycDoc.kycApiResponse = data || req.body;
    await kycDoc.save();

    // If verified, update user and notify
    if (
  finalStatus === 'completed' ||
  finalStatus === 'approved' ||
  finalStatus === 'success' ||
  finalStatus === 'found'
) {
  const user = await db.User.findByPk(kycDoc.userId);
  if (user && user.kycStatus !== 'approved') { // Only notify if not already approved
    user.kycStatus = 'approved';
    await user.save();

    const notifyMsg = 'Congratulations! Your identity has been verified. You now have full access to ModernPay features.';
    const notifyTitle = 'Identity Verified';

    try { await sendNotification(user, notifyMsg, notifyTitle); } catch (e) { console.error('Push notification error:', e.message); }
    try { await sendEmail({ to: user.email, subject: notifyTitle, text: notifyMsg }); } catch (e) { console.error('Email error:', e.message); }
    try { if (user.phoneNumber) await sendSms(user.phoneNumber, notifyMsg); } catch (e) { console.error('SMS error:', e.message); }
  }
}

    console.log('✅ Youverify webhook processed:', { ref, status: finalStatus, type: finalType, event });
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Youverify Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};