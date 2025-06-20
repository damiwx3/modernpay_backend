const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/security.controller');

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security settings (PIN, 2FA, password)
 */

/**
 * @swagger
 * /api/security/set-pin:
 *   post:
 *     summary: Set or update transaction PIN
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN set successfully
 */
router.post('/set-pin', auth, controller.setPin);

/**
 * @swagger
 * /api/security/enable-2fa:
 *   post:
 *     summary: Enable two-factor authentication
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA enabled
 */
router.post('/enable-2fa', auth, controller.enable2FA);

/**
 * @swagger
 * /api/security/disable-2fa:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA disabled
 */
router.post('/disable-2fa', auth, controller.disable2FA);

/**
 * @swagger
 * /api/security/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', auth, controller.changePassword);

/**
 * @swagger
 * /api/security/enable-faceid:
 *   post:
 *     summary: Enable Face ID authentication
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Face ID enabled
 */
router.post('/enable-faceid', auth, controller.enableFaceId);

/**
 * @swagger
 * /api/security/disable-faceid:
 *   post:
 *     summary: Disable Face ID authentication
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Face ID disabled
 */
router.post('/disable-faceid', auth, controller.disableFaceId);

module.exports = router;