const express = require('express');
const router = express.Router();
const controller = require('../controllers/dispute.controller');
const auth = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Disputes
 *   description: Handle transaction-related disputes
 */

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Raise a transaction dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dispute submitted
 */
router.post('/', auth, controller.raiseDispute);

/**
 * @swagger
 * /api/disputes:
 *   get:
 *     summary: Get all user disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute list
 */
router.get('/', auth, controller.getMyDisputes);

/**
 * @swagger
 * /api/disputes/admin:
 *   get:
 *     summary: Admin view of all disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All disputes fetched
 */
router.get('/admin', adminAuth, controller.getAllDisputes);

/**
 * @swagger
 * /api/disputes/admin/{id}/resolve:
 *   put:
 *     summary: Admin resolves a dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [resolved, rejected]
 *     responses:
 *       200:
 *         description: Dispute updated
 */
router.put('/admin/:id/resolve', adminAuth, controller.resolveDispute);

module.exports = router;