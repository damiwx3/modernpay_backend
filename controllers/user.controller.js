const db = require('../models');
const { v4: uuidv4 } = require('uuid');

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

// Transfer funds between wallets
exports.transferFunds = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: User not found in request.' });
  }
  const { recipientAccountNumber, amount } = req.body;
  const value = parseFloat(amount);

  if (!recipientAccountNumber || isNaN(value) || value <= 0) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  const t = await db.sequelize.transaction();
  try {
    // Find sender and recipient wallets inside the transaction
    const senderWallet = await db.Wallet.findOne({ where: { userId: req.user.id }, transaction: t });
    const recipientWallet = await db.Wallet.findOne({ where: { accountNumber: recipientAccountNumber }, transaction: t });

    if (!recipientWallet) return res.status(404).json({ message: 'Recipient not found' });
    if (recipientWallet.userId === req.user.id) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    if (!senderWallet || parseFloat(senderWallet.balance) < value) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Update balances (ALWAYS use parseFloat for DECIMAL fields)
    senderWallet.balance = parseFloat(senderWallet.balance) - value;
    recipientWallet.balance = parseFloat(recipientWallet.balance) + value;

    // Save changes inside the transaction
    await senderWallet.save({ transaction: t });
    await recipientWallet.save({ transaction: t });

    // Fetch sender and recipient user details for fullName
    const senderUser = await db.User.findByPk(senderWallet.userId);
    const recipientUser = await db.User.findByPk(recipientWallet.userId);

    // Create transaction records for both users
    await db.Transaction.bulkCreate([
      {
        userId: req.user.id,
        type: 'debit',
        amount: value,
        reference: uuidv4(),
        description: `Transfer to ${recipientAccountNumber}`,
        status: 'success',
        category: 'Wallet Transfer',
        senderName: senderUser ? senderUser.fullName : null,
        recipientName: recipientUser ? recipientUser.fullName : null,
        recipientAccount: recipientAccountNumber,
      },
      {
        userId: recipientWallet.userId,
        type: 'credit',
        amount: value,
        reference: uuidv4(),
        description: `Received from ${senderWallet.accountNumber}`,
        status: 'success',
        category: 'Wallet Transfer',
        senderName: senderUser ? senderUser.fullName : null,
        recipientName: recipientUser ? recipientUser.fullName : null,
        recipientAccount: recipientAccountNumber,
      },
    ], { transaction: t });

    await t.commit();

    res.status(200).json({ message: 'Transfer successful', senderBalance: senderWallet.balance });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Transfer failed', error: err.message });
  }
};

// Verify account number for internal wallet transfer
exports.verifyAccount = async (req, res) => {
  const { accountNumber } = req.body;
  if (!accountNumber) {
    return res.status(400).json({ message: 'Account number is required' });
  }

  try {
    const wallet = await db.Wallet.findOne({ where: { accountNumber } });
    if (!wallet) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = await db.User.findByPk(wallet.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's full name (since your model uses fullName)
    return res.status(200).json({ name: user.fullName });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify account' });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;

    // Handle selfie upload
    if (req.file) {
      // Save the file path or URL to the user record
      user.selfieUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.selfieUrl) {
      // Optionally allow updating selfieUrl directly (for remote URLs)
      user.selfieUrl = req.body.selfieUrl;
    }

    await user.save();

    // Exclude password from response
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({ message: 'Profile updated successfully', user: userData });
  } catch (err) {
    console.log('Update profile error:', err); // <-- Add this line
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