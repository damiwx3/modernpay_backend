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

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Get a specific audit log by ID
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log found
 *       404:
 *         description: Audit log not found
 */
router.get('/logs/:id', auth, controller.getAuditLogById);

module.exports = router;