const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Export statements and reports
 */

/**
 * @swagger
 * /api/reports/monthly-statement:
 *   get:
 *     summary: Download PDF monthly statement
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file of current month's statement
 */
router.get('/monthly-statement', auth, controller.generateMonthlyStatement);

/**
 * @swagger
 * /api/reports/export-csv:
 *   get:
 *     summary: Export transactions to CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file with all transactions
 */
router.get('/export-csv', auth, controller.exportCSV);

module.exports = router;