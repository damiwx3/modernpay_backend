const express = require('express');
const router = express.Router();
const controller = require('../controllers/member.controller');
const auth = require('../middleware/auth.middleware');

router.get('/:id/profile', auth, controller.getMemberProfile);

module.exports = router;