const express = require('express');
const router = express.Router();
const controller = require('../controllers/notify.controller');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Admin can send email/SMS to users
 */

/**
 * @swagger
 * /api/notify:
 *   post:
 *     summary: Send notification to a single user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - via
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Optional if email or phone provided
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               via:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms]
 *     responses:
 *       200:
 *         description: Notification sent
 *       400:
 *         description: Invalid input
 */
router.post('/', adminAuth, controller.sendNotification);

/**
 * @swagger
 * /api/notify/bulk:
 *   post:
 *     summary: Send notification to multiple users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - audience
 *               - via
 *             properties:
 *               audience:
 *                 type: string
 *                 enum: [all, active, kyc_pending]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               via:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms]
 *     responses:
 *       200:
 *         description: Bulk notification sent
 *       400:
 *         description: Invalid request
 */
router.post('/bulk', adminAuth, controller.sendBulkNotification);

module.exports = router;
