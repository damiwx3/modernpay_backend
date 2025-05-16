const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use 'outlook', 'yahoo', or custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password for Gmail if 2FA enabled
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `"ModernPay Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to} (${info.messageId})`);
  } catch (err) {
    console.error(`❌ Email to ${to} failed:`, err.message);
  }
};

module.exports = sendEmail;
