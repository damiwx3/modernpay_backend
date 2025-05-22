const express = require('express');
const router = express.Router();
const controller = require('../controllers/webhook.controller');

/**
 * @swagger
 * /api/webhooks/flutterwave:
 *   post:
 *     summary: Flutterwave webhook handler
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/flutterwave', controller.flutterwaveWebhook);

module.exports = router;