const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSms = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });
    console.log(`📱 SMS sent to ${to}`);
  } catch (err) {
    console.error(`❌ SMS failed: ${err.message}`);
  }
};

module.exports = sendSms;
