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
router.post('/webhook/paystack', webhookController.paystackWebhook);

module.exports = router;
