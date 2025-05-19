const express = require('express');
const router = express.Router();
const controller = require('../controllers/bill.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/bills/pay:
 *   post:
 *     summary: Pay for a bill (airtime, data, etc.)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 */
router.post('/pay', auth, controller.payBill);

/**
 * @swagger
 * /api/bills/history:
 *   get:
 *     summary: Get user bill payment history
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', auth, controller.getHistory);

/**
 * @swagger
 * /api/bills/categories:
 *   get:
 *     summary: List all bill categories
 *     tags: [Bills]
 */
router.get('/categories', controller.getCategories);

module.exports = router;
