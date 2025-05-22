const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet and transaction operations
 */

/**
 * @swagger
 * /api/wallets/balance:
 *   get:
 *     summary: Get wallet balance and account number
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved
 */
router.get('/balance', auth, walletController.getBalance);

/**
 * @swagger
 * /api/wallets/fund:
 *   post:
 *     summary: Manually fund the wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 */
router.post('/fund', auth, walletController.fundWallet);

/**
 * @swagger
 * /api/wallets/transfer:
 *   post:
 *     summary: Transfer funds to another user by account number
 *     tags: [Wallet]
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
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer successful
 */
router.post('/transfer', auth, walletController.transferFunds);

/**
 * @swagger
 * /api/wallets/transfer-to-bank:
 *   post:
 *     summary: Transfer funds to external bank using Flutterwave
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankCode
 *               - accountNumber
 *               - amount
 *             properties:
 *               bankCode:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               narration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank transfer successful
 */
router.post('/transfer-to-bank', auth, walletController.transferToBank);

/**
 * @swagger
 * /api/wallets/create-account:
 *   post:
 *     summary: Create a virtual account using Flutterwave
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Virtual account created successfully
 */
router.post('/create-account', auth, walletController.createVirtualAccount);



module.exports = router;