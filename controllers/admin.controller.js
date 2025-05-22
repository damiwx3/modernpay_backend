const db = require('../models');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fullName, phoneNumber, kycStatus, isActive } = req.body;

    user.fullName = fullName || user.fullName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.kycStatus = kycStatus || user.kycStatus;
    user.isActive = typeof isActive === 'boolean' ? isActive : user.isActive;

    await user.save();

    res.status(200).json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ✅ Approve KYC
exports.approveKyc = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.kycStatus = 'approved';
    await user.save();

    res.status(200).json({ message: `KYC approved for ${user.fullName}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve KYC', error: err.message });
  }
};

// Block a user's wallet
exports.blockWallet = async (req, res) => {
  const { userId } = req.body;

  try {
    const wallet = await db.Wallet.findOne({ where: { userId } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.isBlocked = true;
    await wallet.save();

    res.status(200).json({ message: 'Wallet blocked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to block wallet', error: err.message });
  }
};

// ✅ Admin Dashboard Summary
exports.getAdminSummary = async (req, res) => {
  try {
    const [
      userCount,
      totalWallet,
      loanCount,
      pendingKyc
    ] = await Promise.all([
      db.User.count(),
      db.Wallet.sum('balance'),
      db.Loan.count(),
      db.User.count({ where: { kycStatus: 'pending' } })
    ]);

    res.status(200).json({
      totalUsers: userCount,
      totalWalletBalance: Number(totalWallet || 0),
      totalLoans: loanCount,
      pendingKYC: pendingKyc
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get summary', error: err.message });
  }
};
