const express = require('express');
const router = express.Router();
const controller = require('../controllers/transaction.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Simulate a transaction (credit or debit)
 *     tags: [Transactions]
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
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction recorded
 */
router.post('/', auth, controller.createTransaction);

module.exports = router;
