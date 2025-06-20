const db = require('../models'); // Adjust as needed
const bcrypt = require('bcrypt');

// Set or update transaction PIN
exports.setPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ message: 'PIN must be at least 4 digits.' });
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    await db.User.update({ pin: hashedPin }, { where: { id: req.user.id } });
    res.status(200).json({ message: 'PIN set successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to set PIN.' });
  }
};

// Enable 2FA (for example, via email)
exports.enable2FA = async (req, res) => {
  try {
    await db.User.update({ twoFactorEnabled: true }, { where: { id: req.user.id } });
    res.status(200).json({ message: '2FA enabled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable 2FA.' });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    await db.User.update({ twoFactorEnabled: false }, { where: { id: req.user.id } });
    res.status(200).json({ message: '2FA disabled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable 2FA.' });
  }
};

// Enable Face ID
exports.enableFaceId = async (req, res) => {
  try {
    await db.User.update({ faceIdEnabled: true }, { where: { id: req.user.id } });
    res.status(200).json({ message: 'Face ID enabled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable Face ID.' });
  }
};

// Disable Face ID
exports.disableFaceId = async (req, res) => {
  try {
    await db.User.update({ faceIdEnabled: false }, { where: { id: req.user.id } });
    res.status(200).json({ message: 'Face ID disabled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable Face ID.' });
  }
};
// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters and include lowercase, uppercase, number, and special character.'
      });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password.' });
  }
};