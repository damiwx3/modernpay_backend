// routes/virtual_card.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/virtual_card.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: VirtualCards
 *   description: Virtual card management
 */

/**
 * @swagger
 * /api/virtual-cards/create:
 *   post:
 *     summary: Create a new virtual card
 *     tags: [VirtualCards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Card created
 */
router.post('/create', auth, controller.createCard);

/**
 * @swagger
 * /api/virtual-cards:
 *   get:
 *     summary: Get user's virtual card info
 *     tags: [VirtualCards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Card details
 */
router.get('/', auth, controller.getCard);

/**
 * @swagger
 * /api/virtual-cards/freeze:
 *   post:
 *     summary: Freeze or unfreeze virtual card
 *     tags: [VirtualCards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [freeze, unfreeze]
 *     responses:
 *       200:
 *         description: Card status updated
 */
router.post('/freeze', auth, controller.toggleFreeze);

/**
 * @swagger
 * /api/virtual-cards/transactions:
 *   get:
 *     summary: View transactions made with virtual card
 *     tags: [VirtualCards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get('/transactions', auth, controller.getCardTransactions);

module.exports = router;