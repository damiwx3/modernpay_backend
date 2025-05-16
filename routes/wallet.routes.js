const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Wallets
 *   description: Wallet operations (balance, fund, transfer)
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

/**
 * @swagger
 * /api/wallets/fund:
 *   post:
 *     summary: Fund your wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post('/fund', auth, walletController.fundWallet);

/**
 * @swagger
 * /api/wallets/transfer:
 *   post:
 *     summary: Transfer money to another user by account number
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientAccountNumber
 *               - amount
 *             properties:
 *               recipientAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               amount:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Invalid input or insufficient funds
 *       404:
 *         description: Recipient not found
 */
router.post('/transfer', auth, walletController.transferFunds);

module.exports = router;
