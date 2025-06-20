const express = require('express');
const router = express.Router();
const controller = require('../controllers/missed_contribution.controller');
const auth = require('../middleware/auth.middleware');

// Get all missed contributions (admin)
router.get('/', auth, controller.getMissedContributions);

module.exports = router;
