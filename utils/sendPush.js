const admin = require('firebase-admin');

// Initialize Firebase Admin only once in your app!
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT)
    : null;

  if (!serviceAccount) {
    throw new Error('FIREBASE_ANDROID_SERVICE_ACCOUNT env variable is not set or invalid!');
  }

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
      type: customData.type || 'general',
      transactionId: customData.transactionId || '',
      amount: customData.amount || '',
      reference: customData.reference || '',
      screen: customData.screen || '',
      ...customData
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
