const sendEmail = require('./sendEmail');
const sendSms = require('./sendSms');
const sendPush = require('./sendPush'); // <-- You need to implement this
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

    // Push/In-app notification
    if (user.deviceToken) {
      await sendPush(user.deviceToken, subject, message); // Implement sendPush for your platform
      logs.push({
        userId: user.id,
        deviceToken: user.deviceToken,
        channel: 'push',
        subject,
        message,
        status: 'sent'
      });
    }
    await db.Notification.create({
  userId: user.id,
  title: subject,
  message,
  data: customData || null,
  read: false
});

    // Save logs to database
    for (const log of logs) {
      await db.NotificationLog.create(log);
    }

    console.log(`📤 Notification sent to ${user.email || user.phoneNumber || user.deviceToken}`);
  } catch (err) {
    console.error(`❌ Notification failed for ${user.email || user.phoneNumber || user.deviceToken}: ${err.message}`);

    // Log failed attempt
    await db.NotificationLog.create({
      userId: user.id,
      email: user.email,
      phone: user.phoneNumber,
      deviceToken: user.deviceToken,
      channel: user.deviceToken ? 'push' : (user.email ? 'email' : 'sms'),
      subject,
      message,
      status: 'failed'
    });
  }
};

module.exports = sendNotification;
