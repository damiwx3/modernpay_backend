// routes/campaign.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/campaign.controller');
const auth = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Promotional campaigns and loyalty rewards
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all active campaigns
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get('/', controller.getCampaigns);

/**
 * @swagger
 * /api/campaigns/claim/{campaignId}:
 *   post:
 *     summary: Claim a cashback campaign reward
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward claimed
 */
router.post('/claim/:campaignId', auth, controller.claimCashback);

/**
 * @swagger
 * /api/campaigns/referral/bonus:
 *   post:
 *     summary: Grant referral bonus to referrer
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral bonus granted
 */
router.post('/referral/bonus', auth, controller.giveReferralBonus);

/**
 * @swagger
 * /api/campaigns/loyalty:
 *   get:
 *     summary: Check loyalty reward status
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty points and rewards
 */
router.get('/loyalty', auth, controller.getLoyalty);

/**
 * @swagger
 * /api/campaigns/admin:
 *   post:
 *     summary: Admin creates new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - reward
 *             properties:
 *               title:
 *                 type: string
 *               reward:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [cashback, referral, loyalty]
 *     responses:
 *       201:
 *         description: Campaign created
 */
router.post('/admin', adminAuth, controller.createCampaign);

module.exports = router;