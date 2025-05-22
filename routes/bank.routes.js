const express = require('express');
const router = express.Router();
const controller = require('../controllers/bank.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Bank
 *   description: Flutterwave Bank-related routes
 */

/**
 * @swagger
 * /api/bank/list:
 *   get:
 *     summary: Get list of Nigerian banks
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banks fetched successfully
 *       500:
 *         description: Internal error
 */
router.get('/list', auth, controller.getBankList);

/**
 * @swagger
 * /api/bank/verify:
 *   post:
 *     summary: Verify a Nigerian bank account
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_number
 *               - bank_code
 *             properties:
 *               account_number:
 *                 type: string
 *                 example: "0123456789"
 *               bank_code:
 *                 type: string
 *                 example: "058"
 *     responses:
 *       200:
 *         description: Account verified
 *       400:
 *         description: Verification failed
 *       500:
 *         description: Internal error
 */
router.post('/verify', auth, controller.verifyAccountNumber);

module.exports = router;
