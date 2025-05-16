const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Wallets
 *   description: Wallet operations
 */

/**
 * @swagger
 * /api/wallets/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved
 *       401:
 *         description: Unauthorized
 */


router.get('/balance', auth, walletController.getBalance);
router.post('/fund', auth, walletController.fundWallet);
router.post('/transfer', auth, walletController.transferFunds);

module.exports = router;
