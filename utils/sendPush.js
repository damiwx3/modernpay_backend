const admin = require('firebase-admin');

// Initialize Firebase Admin only once in your app!
if (!admin.apps.length) {
  const serviceAccount = require('../path/to/your-firebase-service-account.json'); // <-- Replace with your actual path

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Send a push notification via FCM.
 * @param {string} deviceToken - The FCM device token.
 * @param {string} title - Notification title.
 * @param {string} body - Notification message/body.
 */
const sendPush = async (deviceToken, title, body) => {
  const message = {
    token: deviceToken,
    notification: {
      title,
      body
    },
    data: {
      // You can add custom data here if needed
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
