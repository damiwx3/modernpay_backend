const admin = require('firebase-admin');

let androidServiceAccount, iosServiceAccount;

// Android service account
if (process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT) {
  androidServiceAccount = JSON.parse(process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT);
} else {
  androidServiceAccount = require('./firebase-android.json');
}

// iOS service account
if (process.env.FIREBASE_IOS_SERVICE_ACCOUNT) {
  iosServiceAccount = JSON.parse(process.env.FIREBASE_IOS_SERVICE_ACCOUNT);
} else {
  iosServiceAccount = require('./firebase-ios.json');
}

const androidApp = admin.initializeApp({
  credential: admin.credential.cert(androidServiceAccount),
}, 'android');

const iosApp = admin.initializeApp({
  credential: admin.credential.cert(iosServiceAccount),
}, 'ios');

module.exports = {
  androidApp,
  iosApp,
};