const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/wallets/transactions:
 *   get:
 *     summary: Fetch user transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *       - name: limit
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Returns user's transaction history
 */
router.get('/transactions', auth, transactionController.getUserTransactions);

/**
 * @swagger
 * /api/wallets/transactions:
 *   post:
 *     summary: Create a manual transaction (for test/admin)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type]
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post('/transactions', auth, transactionController.createTransaction);
router.get('/export', auth, transactionController.exportTransactions);

module.exports = router;