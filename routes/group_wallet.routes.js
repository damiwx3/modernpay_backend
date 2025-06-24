const express = require('express');
const router = express.Router();
const groupWalletController = require('../controllers/group_wallet.controller');
const groupAuth = require('../middleware/groupAuth');

router.get('/group-wallet/:groupId', groupAuth, groupWalletController.getWallet);

module.exports = router;