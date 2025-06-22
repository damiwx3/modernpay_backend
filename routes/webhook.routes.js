const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * @swagger
 * /webhook/paystack:
 *   post:
 *     summary: Paystack webhook endpoint for wallet funding
 *     description: Receives Paystack payment notifications and credits user wallet on charge.success.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: charge.success
 *               data:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: success
 *                   amount:
 *                     type: integer
 *                     example: 500000
 *                   reference:
 *                     type: string
 *                     example: "PSK_123456789"
 *                   customer:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "user@email.com"
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       500:
 *         description: Internal webhook error
 */
router.post('/paystack', webhookController.paystackWebhook);

/**
 * @swagger
 * /webhook/vtpass:
 *   post:
 *     summary: VTPass webhook endpoint for bill payment status updates
 *     description: Receives VTPass payment notifications and updates bill payment status.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               request_id:
 *                 type: string
 *                 example: "BILL-1717690000000"
 *               reference:
 *                 type: string
 *                 example: "BILL-1717690000000"
 *               status:
 *                 type: string
 *                 example: "delivered"
 *               code:
 *                 type: string
 *                 example: "000"
 *               response_description:
 *                 type: string
 *                 example: "Transaction Successful"
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       500:
 *         description: Internal webhook error
 */
router.post('/vtpass', webhookController.vtpassWebhook);
router.post('/squad', webhookController.squadWebhook);

router.post('/youverify', express.json({ type: '*/*' }), webhookController.youverifyWebhook);

module.exports = router;