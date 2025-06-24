const express = require('express');
const router = express.Router();
const platformFeeController = require('../controllers/platform_fee.controller');
const adminAuth = require('../middleware/adminAuth');

router.get('/platform-fees', adminAuth, platformFeeController.getAllFees);

module.exports = router;