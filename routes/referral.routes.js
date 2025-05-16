const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: User referral tracking
 */

/**
 * @swagger
 * /api/referrals/my-referrals:
 *   get:
 *     summary: Get referrals made by current user
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of referred users
 */


router.get('/my-referrals', auth, referralController.getMyReferrals);
router.get('/bonus', auth, referralController.getReferralBonus);
router.post('/apply-code', auth, referralController.applyReferralCode);

module.exports = router;
