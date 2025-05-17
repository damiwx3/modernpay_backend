const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Statement downloads and transaction exports
 */

/**
 * @swagger
 * /api/reports/statement:
 *   get:
 *     summary: Download PDF monthly statement
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF downloaded
 */
router.get('/statement', auth, controller.downloadPdf);

/**
 * @swagger
 * /api/reports/transactions/csv:
 *   get:
 *     summary: Export transactions as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV exported
 */
router.get('/transactions/csv', auth, controller.downloadCsv);

module.exports = router;