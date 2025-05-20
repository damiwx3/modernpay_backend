const express = require('express');
const router = express.Router();
const controller = require('../controllers/bank.controller');
const auth = require('../middleware/auth.middleware');

router.get('/list', auth, controller.getBankList);
router.post('/verify', auth, controller.verifyAccountNumber);

module.exports = router;
