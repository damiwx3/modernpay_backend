const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Public webhook - no auth middleware
router.post('/flutterwave', webhookController.handleFlutterwaveWebhook);

module.exports = router;
