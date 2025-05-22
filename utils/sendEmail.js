const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
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
    console.error('❌ Full error stack:', err);
  }
};

module.exports = sendEmail;