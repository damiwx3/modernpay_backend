const db = require('../models');

exports.getMyReferrals = async (req, res) => {
  try {
    const referrals = await db.Referral.findAll({
      where: { referrerId: req.user.id },
      include: [{ model: db.User, as: 'Referred' }]
    });

    res.status(200).json({ referrals });
  } catch (err) {
    console.error('getMyReferrals error:', err); // Added error logging
    res.status(500).json({ message: 'Failed to fetch referrals' });
  }
};

exports.getReferralBonus = async (req, res) => {
  try {
    const bonuses = await db.Referral.findAll({
      where: { referrerId: req.user.id, status: 'confirmed' }
    });

    // Handle possible null/NaN bonusAmount
    const totalBonus = bonuses.reduce((sum, r) => {
      const bonus = parseFloat(r.bonusAmount);
      return sum + (isNaN(bonus) ? 0 : bonus);
    }, 0);

    res.status(200).json({ totalBonus, referrals: bonuses.length });
  } catch (err) {
    console.error('getReferralBonus error:', err); // Added error logging
    res.status(500).json({ message: 'Failed to fetch referral bonus' });
  }
};

exports.applyReferralCode = async (req, res) => {
  try {
    const { referrerId } = req.body;

    if (referrerId === req.user.id) {
      return res.status(400).json({ message: 'You cannot refer yourself' });
    }

    const existing = await db.Referral.findOne({
      where: { referredId: req.user.id }
    });

    if (existing) return res.status(400).json({ message: 'Referral already applied' });

    const referrer = await db.User.findByPk(referrerId);
    if (!referrer) return res.status(404).json({ message: 'Referrer not found' });

    await db.Referral.create({
      referrerId,
      referredId: req.user.id,
      status: 'pending',
      bonusAmount: 0
    });

    res.status(200).json({ 
      message: 'Referral applied successfully',
      referralCode: referrer.referralCode // <-- Return the referral code
    });
  } catch (err) {
    console.error('applyReferralCode error:', err);
    res.status(500).json({ message: 'Failed to apply referral' });
  }
};