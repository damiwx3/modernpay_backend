const express = require('express');
const router = express.Router();
const controller = require('../controllers/setting.controller');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Application configuration and toggles
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get('/', adminAuth, controller.getAllSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update a system setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.put('/', adminAuth, controller.updateSetting);

module.exports = router;