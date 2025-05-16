const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: Server & system status
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

module.exports = router;
