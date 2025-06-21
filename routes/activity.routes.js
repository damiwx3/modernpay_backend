const express = require('express');
const router = express.Router();
const controller = require('../controllers/activity.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, controller.getUserActivities);

module.exports = router;