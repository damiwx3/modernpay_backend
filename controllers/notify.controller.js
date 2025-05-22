const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const db = require('../models');

// 🔹 Single-user notification
exports.sendNotification = async (req, res) => {
  const { userId, email, phone, subject, message, via } = req.body;

  if (!message || (!email && !phone && !userId)) {
    return res.status(400).json({ message: 'Provide userId or email/phone, and a message.' });
  }

  try {
    let user = null;
    if (userId) {
      user = await db.User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'User not found.' });
    }

    const recipientEmail = email || user?.email;
    const recipientPhone = phone || user?.phoneNumber;
    const results = [];

    if (via?.includes('email') && recipientEmail) {
      try {
        await sendEmail(recipientEmail, subject || 'Notification', message);
        results.push(`✅ Email sent to ${recipientEmail}`);

        await db.NotificationLog.create({
          userId: user?.id || null,
          email: recipientEmail,
          channel: 'email',
          subject,
          message,
          status: 'sent'
        });
      } catch (err) {
        await db.NotificationLog.create({
          userId: user?.id || null,
          email: recipientEmail,
          channel: 'email',
          subject,
          message,
          status: 'failed'
        });
      }
    }

    if (via?.includes('sms') && recipientPhone) {
      try {
        await sendSms(recipientPhone, message);
        results.push(`✅ SMS sent to ${recipientPhone}`);

        await db.NotificationLog.create({
          userId: user?.id || null,
          phone: recipientPhone,
          channel: 'sms',
          message,
          status: 'sent'
        });
      } catch (err) {
        await db.NotificationLog.create({
          userId: user?.id || null,
          phone: recipientPhone,
          channel: 'sms',
          message,
          status: 'failed'
        });
      }
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'No valid contact method provided.' });
    }

    res.status(200).json({ message: 'Notification sent.', results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notification', error: err.message });
  }
};

// 🔸 Bulk notification to multiple users
exports.sendBulkNotification = async (req, res) => {
  const { audience, subject, message, via } = req.body;

  if (!audience || !message || !via || !Array.isArray(via)) {
    return res.status(400).json({ message: 'audience, message, and via (email/sms) are required.' });
  }

  try {
    let users = [];

    if (audience === 'all') {
      users = await db.User.findAll({ where: { isActive: true } });
    } else if (audience === 'kyc_pending') {
      users = await db.User.findAll({ where: { kycStatus: 'pending', isActive: true } });
    } else if (audience === 'active') {
      users = await db.User.findAll({ where: { isActive: true } });
    } else {
      return res.status(400).json({ message: 'Unsupported audience type.' });
    }

    let sentCount = 0;
    let failed = 0;

    for (const user of users) {
      for (const method of via) {
        try {
          if (method === 'email' && user.email) {
            await sendEmail(user.email, subject || 'Notification', message);

            await db.NotificationLog.create({
              userId: user.id,
              email: user.email,
              channel: 'email',
              subject,
              message,
              status: 'sent'
            });
          }

          if (method === 'sms' && user.phoneNumber) {
            await sendSms(user.phoneNumber, message);

            await db.NotificationLog.create({
              userId: user.id,
              phone: user.phoneNumber,
              channel: 'sms',
              message,
              status: 'sent'
            });
          }

          sentCount++;
        } catch (err) {
          console.error(`❌ Failed for ${user.email || user.phoneNumber}:`, err.message);
          await db.NotificationLog.create({
            userId: user.id,
            email: user.email,
            phone: user.phoneNumber,
            channel: method,
            subject,
            message,
            status: 'failed'
          });
          failed++;
        }
      }
    }

    res.status(200).json({
      message: 'Bulk notification completed.',
      totalRecipients: users.length,
      success: sentCount,
      failed,
    });
  } catch (err) {
    res.status(500).json({ message: 'Bulk notification failed', error: err.message });
  }
};
