const sendEmail = require('./sendEmail');
const sendSms = require('./sendSms');
const db = require('../models');

const sendNotification = async (user, message, subject = 'ModernPay Notification') => {
  const logs = [];

  try {
    if (user.email) {
      await sendEmail(user.email, subject, message);
      logs.push({
        userId: user.id,
        email: user.email,
        channel: 'email',
        subject,
        message,
        status: 'sent'
      });
    }

    if (user.phoneNumber) {
      await sendSms(user.phoneNumber, message);
      logs.push({
        userId: user.id,
        phone: user.phoneNumber,
        channel: 'sms',
        message,
        status: 'sent'
      });
    }

    // Save logs to database
    for (const log of logs) {
      await db.NotificationLog.create(log);
    }

    console.log(`📤 Notification sent to ${user.email || user.phoneNumber}`);
  } catch (err) {
    console.error(`❌ Notification failed for ${user.email || user.phoneNumber}: ${err.message}`);

    // Log failed attempt
    await db.NotificationLog.create({
      userId: user.id,
      email: user.email,
      phone: user.phoneNumber,
      channel: user.email ? 'email' : 'sms',
      subject,
      message,
      status: 'failed'
    });
  }
};

module.exports = sendNotification;
