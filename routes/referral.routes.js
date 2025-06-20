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

/**
 * @swagger
 * /api/referrals/bonus:
 *   get:
 *     summary: Get total referral bonus for current user
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total referral bonus and count
 */
router.get('/bonus', auth, referralController.getReferralBonus);

/**
 * @swagger
 * /api/referrals/apply-code:
 *   post:
 *     summary: Apply a referral code
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referrerId:
 *                 type: integer
 *                 description: The user ID of the referrer
 *     responses:
 *       200:
 *         description: Referral applied successfully
 *       400:
 *         description: Referral already applied or invalid
 *       404:
 *         description: Referrer not found
 */
router.post('/apply-code', auth, referralController.applyReferralCode);

module.exports = router;