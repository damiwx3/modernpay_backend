const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');

// Helper to convert local phone numbers to international format (Nigeria)
function toInternational(phone) {
  if (!phone) return phone;
  phone = phone.trim();
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+234' + phone.slice(1);
  return phone;
}

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters and include lowercase, uppercase, number, and special character.'
      });
    }

    // Check for duplicate email
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check for duplicate phone number (if provided)
    if (phoneNumber) {
      const existingPhone = await db.User.findOne({ where: { phoneNumber } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({ fullName, email, phoneNumber, password: hashedPassword });

    const otp = generateOTP();
    await db.OTPCode.create({
      userId: user.id,
      code: otp,
      type: 'registration',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendEmail({
      to: email,
      subject: 'Your ModernPay OTP Code',
      text: `Hi ${fullName},\n\nYour OTP is: ${otp}\nIt will expire in 10 minutes.\n\n- ModernPay`
    });

    if (phoneNumber) {
      const intlPhone = toInternational(phoneNumber);
      await sendSms(
        intlPhone,
        `Hi ${fullName}, your ModernPay OTP is ${otp}. It expires in 10 minutes.`
      );
    }

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'register',
      status: 'success'
    });

    res.status(201).json({ message: 'User registered. OTP sent via Email and SMS.' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      await db.AuditLog.create({
        userId: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: 'login',
        status: 'failed'
      });
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await db.AuditLog.create({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: 'login',
        status: 'failed'
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2d' });

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'login',
      status: 'success'
    });

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = await db.OTPCode.findOne({
      where: {
        userId: user.id,
        type: 'registration',
        used: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (otp.blockedUntil && otp.blockedUntil > new Date()) {
      const wait = Math.ceil((otp.blockedUntil - new Date()) / 60000);
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${wait} minutes.` });
    }

    if (otp.code !== code) {
      otp.attempts = (otp.attempts || 0) + 1;
      if (otp.attempts >= 3) {
        otp.blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      }
      await otp.save();
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    otp.used = true;
    otp.attempts = 0;
    otp.blockedUntil = null;
    await otp.save();

    user.kycStatus = 'pending';
    await user.save();

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'verify_otp',
      status: 'success'
    });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err.message);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    await db.OTPCode.create({
      userId: user.id,
      code: otp,
      type: 'registration',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendEmail({
      to: user.email,
      subject: 'Your New OTP Code',
      text: `Hi ${user.fullName},\n\nYour new OTP is: ${otp}\nIt expires in 10 minutes.`
    });

    if (user.phoneNumber) {
      const intlPhone = toInternational(user.phoneNumber);
      await sendSms(
        intlPhone,
        `Your new ModernPay OTP is: ${otp}. Expires in 10 minutes.`
      );
    }

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'resend_otp',
      status: 'success'
    });

    res.status(200).json({ message: 'OTP resent via Email and SMS.' });
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    await db.OTPCode.create({
      userId: user.id,
      code: otp,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset Your ModernPay Password',
      text: `Hi ${user.fullName},\n\nYour password reset OTP is: ${otp}\nIt expires in 10 minutes.`
    });

    if (user.phoneNumber) {
      const intlPhone = toInternational(user.phoneNumber);
      await sendSms(intlPhone, `ModernPay reset OTP: ${otp}`);
    }

    res.status(200).json({ message: 'OTP sent to email and phone' });
  } catch (err) {
    console.error('Forgot Password error:', err.message);
    res.status(500).json({ message: 'Could not send OTP' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = await db.OTPCode.findOne({
      where: {
        userId: user.id,
        type: 'password_reset',
        used: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (otp.blockedUntil && otp.blockedUntil > new Date()) {
      const wait = Math.ceil((otp.blockedUntil - new Date()) / 60000);
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${wait} minutes.` });
    }

    if (otp.code !== code) {
      otp.attempts = (otp.attempts || 0) + 1;
      if (otp.attempts >= 3) {
        otp.blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      }
      await otp.save();
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters and include lowercase, uppercase, number, and special character.'
      });
    }

    otp.used = true;
    otp.attempts = 0;
    otp.blockedUntil = null;
    await otp.save();

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'reset_password',
      status: 'success'
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password error:', err.message);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};