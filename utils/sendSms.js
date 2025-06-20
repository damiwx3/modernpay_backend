const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Format Nigerian numbers to E.164
function formatPhoneNumber(phone) {
  // Remove spaces and dashes
  phone = phone.replace(/[\s-]/g, '');
  // If starts with 0, replace with +234
  if (phone.startsWith('0')) {
    return '+234' + phone.slice(1);
  }
  // If starts with 234, add +
  if (phone.startsWith('234')) {
    return '+' + phone;
  }
  // If already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  // Otherwise, return as is (may fail)
  return phone;
}

const sendSms = async (to, message) => {
  try {
    const formattedTo = formatPhoneNumber(to);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formattedTo
    });
    console.log(`📱 SMS sent to ${formattedTo}`);
  } catch (err) {
    console.error(`❌ SMS failed: ${err.message}`);
  }
};

module.exports = sendSms;