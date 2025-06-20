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
 *               remark:
 *                 type: string
 *                 description: Optional remark for the transfer
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Invalid transfer input or insufficient balance
 *       404:
 *         description: Recipient not found
 */
router.post('/transfer', auth, walletController.transferFunds);

/**
 * @swagger
 * /api/wallets/transfer-to-bank:
 *   post:
 *     summary: Transfer funds to external bank using Paystack
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
 * /api/wallets/create-virtual-account:
 *   post:
 *     summary: Create a virtual account for a user (Paystack Dedicated NUBAN)
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
 *               - email
 *               - firstName
 *               - lastName
 *               - phone
 *               - preferred_bank
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *                 description: User's phone number (required by Paystack)
 *               preferred_bank:
 *                 type: string
 *                 description: Optional. e.g. wema-bank, providus-bank, etc.
 *     responses:
 *       200:
 *         description: Virtual account created
 *       500:
 *         description: Failed to create virtual account
 */
router.post('/create-virtual-account', auth, walletController.createVirtualAccount);
/**
 * @swagger
 * /api/wallets/set-pin:
 *   post:
 *     summary: Set or update the user's transaction PIN
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
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 description: The new transaction PIN (minimum 4 digits)
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Transaction PIN set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction PIN set successfully
 *       400:
 *         description: Invalid PIN or missing PIN
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PIN must be at least 4 digits
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Failed to set PIN
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to set PIN
 */
router.post('/set-pin', auth, walletController.setTransactionPin);
/**
 * @swagger
 * /api/wallets/transaction/{reference}:
 *   get:
 *     summary: Get a transaction by reference
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction reference
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     reference:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     category:
 *                       type: string
 *                     senderName:
 *                       type: string
 *                     recipientName:
 *                       type: string
 *                     recipientAccount:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Reference is required
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Failed to fetch transaction
 */
router.get('/transaction/:reference', auth, walletController.getTransactionByReference);
router.get('/supported-dedicated-banks', auth, walletController.getSupportedDedicatedBanks);
router.get('/transactions', auth, walletController.getTransactions);
router.get('/user-by-account/:accountNumber', auth, walletController.getUserByAccountNumber);


module.exports = router;