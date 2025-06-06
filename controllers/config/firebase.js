const admin = require('firebase-admin');

const androidApp = admin.initializeApp({
  credential: admin.credential.cert(require('./config/firebase-android.json')),
}, 'android');

const iosApp = admin.initializeApp({
  credential: admin.credential.cert(require('./config/firebase-ios.json')),
}, 'ios');

module.exports = {
  androidApp,
  iosApp,
};