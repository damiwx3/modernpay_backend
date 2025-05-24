const express = require('express');
const router = express.Router();
const controller = require('../controllers/webhook.controller');

/**
 * @swagger
 * /api/webhooks/moniepoint:
 *   post:
 *     summary: Moniepoint webhook handler
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/moniepoint', controller.moniepointWebhook);

module.exports = router;
