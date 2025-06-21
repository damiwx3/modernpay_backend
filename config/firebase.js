const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let androidServiceAccount, iosServiceAccount;

// Android service account
if (process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT) {
  console.log('Using FIREBASE_ANDROID_SERVICE_ACCOUNT from env');
  androidServiceAccount = JSON.parse(process.env.FIREBASE_ANDROID_SERVICE_ACCOUNT);
} else {
  const androidPath = path.join(__dirname, 'firebase-android.json');
  if (fs.existsSync(androidPath)) {
    console.log('Using firebase-android.json from file');
    androidServiceAccount = require(androidPath);
  } else {
    throw new Error('Firebase Android service account not found: set FIREBASE_ANDROID_SERVICE_ACCOUNT env variable or provide config/firebase-android.json');
  }
}

// iOS service account
if (process.env.FIREBASE_IOS_SERVICE_ACCOUNT) {
  console.log('Using FIREBASE_IOS_SERVICE_ACCOUNT from env');
  iosServiceAccount = JSON.parse(process.env.FIREBASE_IOS_SERVICE_ACCOUNT);
} else {
  const iosPath = path.join(__dirname, 'firebase-ios.json');
  if (fs.existsSync(iosPath)) {
    iosServiceAccount = require(iosPath);
  } else {
    throw new Error('Firebase iOS service account not found: set FIREBASE_IOS_SERVICE_ACCOUNT env variable or provide config/firebase-ios.json');
  }
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