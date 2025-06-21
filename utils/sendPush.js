const { androidApp } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Send a push notification via FCM.
 * @param {string} deviceToken - The FCM device token.
 * @param {string} title - Notification title.
 * @param {string} body - Notification message/body.
 * @param {object} customData - (Optional) Custom data to send with the notification.
 */
const sendPush = async (deviceToken, title, body, customData = {}) => {
  const message = {
    token: deviceToken,
    notification: {
      title,
      body
    },
    data: {
      type: customData.type || 'general',
      transactionId: customData.transactionId || '',
      amount: customData.amount || '',
      reference: customData.reference || '',
      screen: customData.screen || '',
      ...customData
    }
  };

  try {
    // Use the named app instance for messaging
    const response = await admin.messaging(androidApp).send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error.message);
    throw error;
  }
};

module.exports = sendPush;