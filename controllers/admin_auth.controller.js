const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Step 1: Admin login with email & password → sends OTP
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await db.AdminUser.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await db.OTPCode.create({
      userId: admin.id,
      code: otp,
      type: 'admin-login',
      expiresAt: expires,
    });

    await sendEmail(admin.email, 'Your Admin OTP', `Your login OTP is: ${otp}`);

    res.status(200).json({ message: 'OTP sent to admin email', adminId: admin.id });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Step 2: Verify OTP to get token
exports.verifyAdminOtp = async (req, res) => {
  const { adminId, code } = req.body;

  try {
    const otpEntry = await db.OTPCode.findOne({
      where: {
        userId: adminId,
        code,
        used: false,
        type: 'admin-login',
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      }
    });

    if (!otpEntry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    otpEntry.used = true;
    await otpEntry.save();

    const token = jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '2d' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
};
