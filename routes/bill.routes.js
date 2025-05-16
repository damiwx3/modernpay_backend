const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Bill payment operations (airtime, data, electricity, etc.)
 */

/**
 * @swagger
 * /api/bills/pay:
 *   post:
 *     summary: Pay a utility or airtime bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: string
 *               amount:
 *                 type: number
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bill payment successful
 *       400:
 *         description: Invalid request
 */


router.post('/airtime', auth, billController.buyAirtime);
router.post('/data', auth, billController.buyData);
router.post('/electricity', auth, billController.payElectricityBill);
router.get('/history', auth, billController.getBillPaymentHistory);

module.exports = router;
