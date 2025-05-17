const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/generateOTP');

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({ fullName, email, password: hashedPassword });

    const otp = generateOTP();
    await db.OTPCode.create({
      userId: user.id,
      code: otp,
      type: 'registration',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'register',
      status: 'success'
    });

    res.status(201).json({ message: 'User registered. Verify with OTP.', otp }); // In production, send OTP via SMS/email
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
        code,
        used: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      }
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    otp.used = true;
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

    await db.AuditLog.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'resend_otp',
      status: 'success'
    });

    res.status(200).json({ message: 'OTP resent successfully', otp }); // Replace with SMS/email logic
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};
