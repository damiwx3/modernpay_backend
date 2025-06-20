const admin = require('firebase-admin');

// Initialize Firebase Admin only once in your app!
if (!admin.apps.length) {
  const serviceAccount = require('../config/firebase-android.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

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
      // Example custom fields:
      type: customData.type || 'general',
      transactionId: customData.transactionId || '',
      amount: customData.amount || '',
      reference: customData.reference || '',
      screen: customData.screen || '',
      // Add any other custom fields you want here
      ...customData // This allows you to pass any extra fields dynamically
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error.message);
    throw error;
  }
};

module.exports = sendPush;