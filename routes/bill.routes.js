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
 *             required: [serviceType, amount, phone]
 *             properties:
 *               serviceType:
 *                 type: string
 *               amount:
 *                 type: number
 *               phone:
 *                 type: string
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
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *     responses:
 *       200:
 *         description: Returns filtered bill payment history
 */
router.get('/history', auth, controller.getHistory);

module.exports = router;
