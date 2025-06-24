const db = require('../models');

exports.getWallet = async (req, res) => {
  try {
    const { groupId } = req.params;
    const wallet = await db.GroupWallet.findOne({ where: { groupId } });
    if (!wallet) return res.status(404).json({ message: 'Group wallet not found' });

    // Ensure groupId is present in the response
    const walletData = wallet.toJSON ? wallet.toJSON() : wallet;
    walletData.groupId = groupId;

    res.json(walletData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};