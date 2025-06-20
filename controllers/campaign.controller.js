const db = require('../models');

// ✅ Get all campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await db.Campaign.findAll({ where: { active: true } });
    res.status(200).json({ campaigns });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch campaigns', error: err.message });
  }
};

// ✅ Claim cashback campaign
exports.claimCashback = async (req, res) => {
  const campaignId = req.params.campaignId;
  const userId = req.user.id;

  const t = await db.sequelize.transaction();
  try {
    const campaign = await db.Campaign.findByPk(campaignId, { transaction: t });
    if (!campaign || !campaign.active) {
      await t.rollback();
      return res.status(404).json({ message: 'Campaign not available' });
    }

    // Check campaign date validity
    const now = new Date();
    if (campaign.startDate && campaign.startDate > now || campaign.endDate && campaign.endDate < now) {
      await t.rollback();
      return res.status(400).json({ message: 'Campaign not active.' });
    }

    const cashbackAmount = campaign.reward || 500;

    // Prevent double claim
    const alreadyClaimed = await db.Transaction.findOne({
      where: { userId, description: `Cashback reward`, amount: cashbackAmount },
      transaction: t
    });
    if (alreadyClaimed) {
      await t.rollback();
      return res.status(400).json({ message: 'Cashback already claimed.' });
    }

    const wallet = await db.Wallet.findOne({ where: { userId }, transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    wallet.balance += cashbackAmount;
    await wallet.save({ transaction: t });

    await db.Transaction.create({
      userId,
      type: 'credit',
      amount: cashbackAmount,
      description: 'Cashback reward',
      status: 'success',
    }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: `${cashbackAmount} cashback awarded.` });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to reward cashback', error: err.message });
  }
};

// ✅ Grant referral bonus
exports.giveReferralBonus = async (req, res) => {
  const userId = req.user.id;
  const bonus = 1000;

  const t = await db.sequelize.transaction();
  try {
    // Prevent double claim
    const alreadyClaimed = await db.Transaction.findOne({
      where: { userId, description: 'Referral bonus', amount: bonus },
      transaction: t
    });
    if (alreadyClaimed) {
      await t.rollback();
      return res.status(400).json({ message: 'Referral bonus already claimed.' });
    }

    const wallet = await db.Wallet.findOne({ where: { userId }, transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    wallet.balance += bonus;
    await wallet.save({ transaction: t });

    await db.Transaction.create({
      userId,
      type: 'credit',
      amount: bonus,
      description: 'Referral bonus',
      status: 'success',
    }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Referral bonus awarded.' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Referral bonus failed', error: err.message });
  }
};

// ✅ Check loyalty reward
exports.getLoyalty = async (req, res) => {
  try {
    const txns = await db.Transaction.findAll({
      where: { userId: req.user.id, status: 'success' },
    });

    const total = txns.reduce((sum, t) => sum + Number(t.amount), 0);
    const points = Math.floor(total / 1000);
    const reward = points >= 10 ? 'Free transfer or top-up' : 'Keep transacting!';

    res.status(200).json({ totalSpent: total, points, reward });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get loyalty', error: err.message });
  }
};

// ✅ Admin creates campaign (with basic validation)
exports.createCampaign = async (req, res) => {
  try {
    const { title, reward, type, startDate, endDate } = req.body;

    // Basic validation
    if (!title || !reward || !type || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date.' });
    }

    const newCampaign = await db.Campaign.create({
      title,
      reward,
      type,
      startDate,
      endDate,
      active: true,
    });

    res.status(201).json({ message: 'Campaign created', campaign: newCampaign });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create campaign', error: err.message });
  }
};