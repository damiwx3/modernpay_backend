const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/admin_dashboard.controller');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard stats and audit info
 */

/**
 * @swagger
 * /api/admin-dashboard/overview:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', adminAuth, dashboardController.getDashboardStats);

/**
 * @swagger
 * /api/admin-dashboard/audit-logs:
 *   get:
 *     summary: Retrieve audit logs
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs returned
 *       401:
 *         description: Unauthorized
 */
router.get('/audit-logs', adminAuth, dashboardController.getAuditLogs);

/**
 * @swagger
 * /api/admin-dashboard/kyc-queue:
 *   get:
 *     summary: Get pending KYC submissions
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending KYC list
 *       401:
 *         description: Unauthorized
 */
router.get('/kyc-queue', adminAuth, dashboardController.getPendingKyc);

module.exports = router;
