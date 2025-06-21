const sendEmail = require('./sendEmail');
const sendSms = require('./sendSms');
const sendPush = require('./sendPush');
const db = require('../models');
const { renderTemplate } = require('./notificationTemplates');

/**
 * Send a notification to a single user, respecting their preferences and supporting templates.
 * @param {Object} user - The user object.
 * @param {String} message - The message or template data.
 * @param {String} subject - The notification subject.
 * @param {Object} customData - Additional data for the notification.
 * @param {String} templateName - Optional template name.
 * @param {Object} templateData - Optional data for the template.
 */
const sendNotification = async (
  user,
  message,
  subject = 'ModernPay Notification',
  customData = null,
  templateName = null,
  templateData = null
) => {
  const logs = [];
  const prefs = user.notificationPreferences || {
    email: true,
    sms: false,
    push: true,
    inApp: true
  };

  let renderedMessage = message;
  let renderedHtml = `<p>${message}</p>`;

  // Template rendering with fallback
  if (templateName && templateData) {
    try {
      renderedHtml = renderTemplate(templateName, templateData);
      renderedMessage = renderedHtml.replace(/<[^>]+>/g, ''); 
    } catch (err) {
      // Fallback to plain message if template fails
      console.warn(`Template "${templateName}" not found or failed to render. Using plain message.`);
      renderedHtml = `<p>${message}</p>`;
      renderedMessage = message;
    }
  }

  try {
    // Email notification
    if (prefs.email !== false && user.email) {
      await sendEmail({
        from: 'ModernPay <noreply@modernpayfinance.com>',
        to: user.email,
        subject,
        text: renderedMessage,
        html: renderedHtml
      });
      logs.push({
        userId: user.id,
        email: user.email,
        channel: 'email',
        subject,
        message: renderedMessage,
        status: 'sent'
      });
    }

    // SMS notification
    if (prefs.sms && user.phoneNumber) {
      await sendSms(user.phoneNumber, renderedMessage);
      logs.push({
        userId: user.id,
        phone: user.phoneNumber,
        channel: 'sms',
        message: renderedMessage,
        status: 'sent'
      });
    }

    // Push notification
    if (prefs.push && user.deviceToken) {
      await sendPush(user.deviceToken, subject, renderedMessage, customData || {});
      logs.push({
        userId: user.id,
        deviceToken: user.deviceToken,
        channel: 'push',
        subject,
        message: renderedMessage,
        status: 'sent'
      });
    }

    if (prefs.inApp !== false) {
      await db.Notification.create({
        userId: user.id,
        title: subject,
        message: renderedMessage,
        data: customData || null,
        read: false
      });
    }
    if (logs.length) {
      await db.NotificationLog.bulkCreate(logs);
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

/**
 * Send a notification to multiple users (batch).
 * @param {Array} users 
 * @param {String} message 
 * @param {String} subject 
 * @param {Object} customData 
 * @param {String} templateName 
 * @param {Object} templateData 
 */
const sendBatchNotification = async (
  users,
  message,
  subject = 'ModernPay Notification',
  customData = null,
  templateName = null,
  templateData = null
) => {
  await Promise.all(
    users.map(user =>
      sendNotification(user, message, subject, customData, templateName, templateData)
    )
  );
};

module.exports = { sendNotification, sendBatchNotification };