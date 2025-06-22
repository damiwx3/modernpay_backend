const db = require('../models');
const crypto = require('crypto');
const { sendNotification } = require('../utils/sendNotification');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const { renderTemplate } = require('../utils/notificationTemplates');
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

  // Helpers
  const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
  const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', { minimumFractionDigits: 2 });

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

      if (wallet.balance == null || isNaN(wallet.balance)) wallet.balance = 0;
      wallet.balance = Number(wallet.balance) + Number(amount);
      await wallet.save();

      await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

      // Notify user with template
      try {
        await sendNotification(
          user,
          '',
          'Wallet Funded',
          null,
          'walletFunded',
          {
            amount: formatNaira(amount),
            date: new Date().toLocaleDateString('en-GB'),
            balance: formatNaira(wallet.balance)
          }
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
              '',
              'Wallet Funding Failed',
              null,
              'walletFundingFailed',
              { reference: event.data.reference }
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
      const tx = await db.Transaction.findOne({ where: { reference: event.data.reference } });
      if (tx) {
        user = await db.User.findOne({ where: { id: tx.userId } });
        const wallet = await db.Wallet.findOne({ where: { userId: user.id } });
        if (user && wallet) {
          const maskedAcc = maskAccount(wallet.accountNumber || wallet.account_number || '');
          const recipientInfo = tx.recipientName || tx.recipient_account || 'Recipient';
          const recipientBank = tx.recipientBank || '';
          try {
            await sendNotification(
              user,
              '',
              'Wallet Debit',
              null,
              'walletDebit',
              {
                amount: formatNaira(tx.amount),
                account: maskedAcc,
                recipient: recipientInfo,
                date: new Date().toLocaleDateString('en-GB'),
                balance: formatNaira(wallet.balance)
              }
            );
            await db.WebhookLog.update({ notificationSent: true }, { where: { id: webhookLogId } });
          } catch (notifyErr) {
            await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
            console.error('Notification error:', notifyErr.message);
          }
        }
      }
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
              '',
              'Transfer Failed',
              null,
              'walletTransferFailed',
              { reference: event.data.reference }
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
              '',
              'Transfer Reversed',
              null,
              'walletTransferReversed',
              { reference: event.data.reference }
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

          if (wallet.balance == null || isNaN(wallet.balance)) wallet.balance = 0;
          wallet.balance = Number(wallet.balance) + Number(amount);
          await wallet.save();

          await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

          // Notify user with template
          try {
            await sendNotification(
              user,
              '',
              'Wallet Funded',
              null,
              'walletFunded',
              {
                amount: formatNaira(amount),
                date: new Date().toLocaleDateString('en-GB'),
                balance: formatNaira(wallet.balance)
              }
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

    // 7️⃣ Notify user about bill payment status (with template)
    try {
      const user = await db.User.findOne({ where: { id: bill.userId } });
      if (user) {
        let details = '';
        if (bill.phone) details += `Phone: ${bill.phone}. `;
        if (bill.meterNumber) details += `Meter: ${bill.meterNumber}. `;
        await sendNotification(
          user,
          '',
          newStatus === 'success' ? 'Bill Payment Successful' : 'Bill Payment Failed',
          null,
          newStatus === 'success' ? 'billPaymentSuccess' : 'billPaymentFailed',
          {
            amount: bill.amount,
            type: bill.type,
            reference,
            details
          }
        );
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

        try {
          await sendNotification(
            user,
            '',
            'Identity Verified',
            null,
            'kycVerified',
            {}
          );
          await sendEmail({
            to: user.email,
            subject: 'Identity Verified',
            html: renderTemplate('kycVerified', {})
          });
          if (user.phoneNumber) await sendSms(user.phoneNumber, 'Congratulations! Your identity has been verified. You now have full access to ModernPay features.');
        } catch (e) {
          console.error('Notification error (Youverify):', e.message);
        }
      }
    }

    console.log('✅ Youverify webhook processed:', { ref, status: finalStatus, type: finalType, event });
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Youverify Webhook error:', err.message);
    res.status(500).json({ message: 'Internal webhook error' });
  }
};

exports.squadWebhook = async (req, res) => {
  // 1️⃣ Optional: Verify Squad signature
  const signature = req.headers['x-squad-signature'];
  const secret = process.env.SQUAD_SECRET_KEY;
  if (signature && secret) {
    const computed = require('crypto')
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (computed !== signature) {
      return res.status(401).send('Invalid Squad signature');
    }
  }

  const event = req.body;
  let webhookLogId = null;
  let user = null;

  // Helpers
  const maskAccount = (acc) => acc ? acc.slice(0, 3) + '**' + acc.slice(-3) : '***';
  const formatNaira = (num) => 'NGN' + Number(num).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  try {
    // Log the webhook event
    let webhookLog = await db.WebhookLog.create({
      event: event.event_type || event.event || 'squad',
      reference: event.reference || event.transaction_reference,
      status: event.status || 'received',
      payload: event,
    });
    webhookLogId = webhookLog.id;

    // Handle virtual account credit
    const evt = event.event_type || event.event;
    if (
      evt === 'virtual_account_transaction' &&
      event.status === 'successful' &&
      event.amount && event.account_number
    ) {
      const reference = event.reference || event.transaction_reference;
      // Squad sometimes sends amount in kobo, sometimes in naira (check for decimals)
      let amount = Number(event.amount);
      if (amount > 100000) amount = amount / 100; // likely kobo
      const accountNumber = event.account_number;

      // Find the virtual account
      const virtualAccount = await db.VirtualAccount.findOne({
        where: { accountNumber, provider: 'squad' }
      });
      if (virtualAccount) {
        user = await db.User.findOne({ where: { id: virtualAccount.userId } });
        const wallet = await db.Wallet.findOne({ where: { userId: user.id } });

        // Prevent duplicate credit
        const exists = await db.Transaction.findOne({ where: { reference } });
        if (!exists) {
          let description = 'Squad virtual account funding';

          await db.Transaction.create({
            userId: wallet.userId,
            type: 'credit',
            amount: parseFloat(amount),
            reference: reference,
            description: description,
            status: 'success',
            senderName: event.sender_name || null,
            senderBank: event.sender_bank || null,
            recipientName: user.fullName || null,
            recipientBank: null,
            category: 'wallet_funding'
          });

          if (wallet.balance == null || isNaN(wallet.balance)) wallet.balance = 0;
          wallet.balance = Number(wallet.balance) + Number(amount);
          await wallet.save();

          await db.WebhookLog.update({ userId: user.id }, { where: { id: webhookLogId } });

          // Notify user
          try {
            await sendNotification(
              user,
              '',
              'Wallet Funded',
              null,
              'walletFunded',
              {
                amount: formatNaira(amount),
                date: new Date().toLocaleDateString('en-GB'),
                balance: formatNaira(wallet.balance)
              }
            );
            await db.WebhookLog.update({ notificationSent: true }, { where: { id: webhookLogId } });
          } catch (notifyErr) {
            await db.WebhookLog.update({ errorMessage: notifyErr.message }, { where: { id: webhookLogId } });
            console.error('Notification error:', notifyErr.message);
          }
          console.log(`✅ Squad virtual account funded: ₦${amount} for user ${user.email}`);
        }
      }
    } else {
      console.log('Unhandled Squad event:', evt, event.status);
    }

    // Always return 200 to avoid retries
    res.status(200).send('Squad webhook received');
  } catch (err) {
    if (webhookLogId) {
      await db.WebhookLog.update({ errorMessage: err.message }, { where: { id: webhookLogId } });
    }
    console.error('❌ Squad Webhook error:', err.message);
    // Still return 200 to avoid retries
    res.status(200).send('Squad webhook error handled');
  }
};