const db = require('../models');

// Get current user's profile (excluding password)
exports.getProfile = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Unable to retrieve profile' });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address, selfieUrl } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (selfieUrl) user.selfieUrl = selfieUrl;

    await user.save();

    // Exclude password from response
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({ message: 'Profile updated successfully', user: userData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get any user by ID (admin or internal use)
exports.getUserById = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user' });
  }
};