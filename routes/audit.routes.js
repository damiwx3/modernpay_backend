const express = require('express');
const router = express.Router();
const controller = require('../controllers/audit.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Security logs (login/IP/device)
 */

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get your audit logs
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of security logs
 */
router.get('/logs', auth, controller.getAuditLogs);

module.exports = router;