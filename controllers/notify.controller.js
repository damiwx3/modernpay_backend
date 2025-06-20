const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');
const db = require('../models');

// Placeholder for rate limiting (implement as needed)
async function checkNotificationRateLimit(userId, action) {
  // Example: throw new Error('Too many notifications sent');
}

// 🔹 Single-user notification (email, sms, and in-app)
exports.sendNotification = async (req, res) => {
  const { userId, email, phone, subject, message, via, title } = req.body;

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
    const notificationTitle = title || subject || 'Notification';
    const results = [];

    // In-app notification
    if (user?.id) {
      await db.Notification.create({
        userId: user.id,
        title: notificationTitle,
        message,
        read: false,
      });
      results.push(`✅ In-app notification created for user ${user.id}`);
    }

    // Email notification
    if (via?.includes('email') && recipientEmail) {
      try {
        await checkNotificationRateLimit(user?.id || null, 'email');
        await sendEmail(recipientEmail, notificationTitle, message);
        results.push(`✅ Email sent to ${recipientEmail}`);

        await db.NotificationLog.create({
          userId: user?.id || null,
          email: recipientEmail,
          channel: 'email',
          subject: notificationTitle,
          message,
          status: 'sent'
        });
      } catch (err) {
        await db.NotificationLog.create({
          userId: user?.id || null,
          email: recipientEmail,
          channel: 'email',
          subject: notificationTitle,
          message,
          status: 'failed'
        });
      }
    }

    // SMS notification
    if (via?.includes('sms') && recipientPhone) {
      try {
        await checkNotificationRateLimit(user?.id || null, 'sms');
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
    res.status(500).json({ message: 'Failed to send notification' });
  }
};

// 🔸 Bulk notification to multiple users (with batching and Promise.allSettled)
exports.sendBulkNotification = async (req, res) => {
  const { audience, subject, message, via, title } = req.body;

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

    // Batch size for sending (adjust as needed for provider limits)
    const BATCH_SIZE = 50;
    let sentCount = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      // Send notifications in parallel for this batch
      const promises = [];
      for (const user of batch) {
        promises.push((async () => {
          let batchResults = [];
          // In-app notification
          try {
            await db.Notification.create({
              userId: user.id,
              title: title || subject || 'Notification',
              message,
              read: false,
            });
            batchResults.push('in-app');
          } catch (err) {}

          for (const method of via) {
            try {
              await checkNotificationRateLimit(user.id, method);
              if (method === 'email' && user.email) {
                await sendEmail(user.email, title || subject || 'Notification', message);
                await db.NotificationLog.create({
                  userId: user.id,
                  email: user.email,
                  channel: 'email',
                  subject: title || subject || 'Notification',
                  message,
                  status: 'sent'
                });
                batchResults.push('email');
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
                batchResults.push('sms');
              }
              sentCount++;
            } catch (err) {
              await db.NotificationLog.create({
                userId: user.id,
                email: user.email,
                phone: user.phoneNumber,
                channel: method,
                subject: title || subject || 'Notification',
                message,
                status: 'failed'
              });
              failed++;
            }
          }
        })());
      }
      // Wait for all in this batch to finish
      await Promise.allSettled(promises);

      // Optional: Add a delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.status(200).json({
      message: 'Bulk notification completed.',
      totalRecipients: users.length,
      success: sentCount,
      failed,
    });
  } catch (err) {
    res.status(500).json({ message: 'Bulk notification failed' });
  }
};