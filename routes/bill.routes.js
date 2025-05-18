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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceType, amount]
 *             properties:
 *               serviceType:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bill paid successfully
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
 *     responses:
 *       200:
 *         description: Returns user's bill payment records
 */
router.get('/history', auth, controller.getHistory);

module.exports = router;
