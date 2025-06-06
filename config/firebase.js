const admin = require('firebase-admin');

const androidApp = admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-android.json')),
}, 'android');

const iosApp = admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-ios.json')),
}, 'ios');

module.exports = {
  androidApp,
  iosApp,
};
