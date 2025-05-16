const express = require('express');
const router = express.Router();
const controller = require('../controllers/transaction.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction-related operations
 */

/**
 * @swagger
 * /api/transactions/my:
 *   get:
 *     summary: Get my transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/my', auth, controller.getMyTransactions);

/**
 * @swagger
 * /api/transactions/create:
 *   post:
 *     summary: Manually create a transaction log
 *     tags: [Transactions]
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
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/create', auth, controller.createTransaction);

module.exports = router;
