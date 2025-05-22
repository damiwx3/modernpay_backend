const express = require('express');
const router = express.Router();
const controller = require('../controllers/system.controller');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System settings and admin toggles
 */

/**
 * @swagger
 * /api/system/status:
 *   get:
 *     summary: Get current server status and uptime
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is online
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     seconds:
 *                       type: integer
 *                     human:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 env:
 *                   type: string
 *                   example: development
 */
router.get('/status', (req, res) => {
  const uptimeSec = process.uptime();

  const humanReadable = () => {
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = Math.floor(uptimeSec % 60);
    return `${h}h ${m}m ${s}s`;
  };

  res.json({
    status: 'ok',
    uptime: {
      seconds: Math.floor(uptimeSec),
      human: humanReadable(),
    },
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/system/maintenance:
 *   post:
 *     summary: Toggle maintenance mode (on/off)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [on, off]
 *                 example: off
 *     responses:
 *       200:
 *         description: Maintenance mode updated
 *       400:
 *         description: Invalid mode
 *       401:
 *         description: Unauthorized
 */
router.post('/maintenance', adminAuth, controller.setMaintenanceMode);

module.exports = router;