const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan application and repayment
 */

/**
 * @swagger
 * /api/loans/apply:
 *   post:
 *     summary: Apply for a loan
 *     tags: [Loans]
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
 *               interestRate:
 *                 type: number
 *               durationInMonths:
 *                 type: number
 *               repaymentAmount:
 *                 type: number
 *               isAutoPayment:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Loan application submitted
 *       400:
 *         description: Invalid request
 */
router.post('/apply', auth, loanController.applyForLoan);

/**
 * @swagger
 * /api/loans/my-loans:
 *   get:
 *     summary: Get all loans for the authenticated user
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's loans
 */
router.get('/my-loans', auth, loanController.getUserLoans);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Get a specific loan by ID
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Loan details
 *       404:
 *         description: Loan not found
 */
router.get('/:id', auth, loanController.getLoanById);

/**
 * @swagger
 * /api/loans/{id}/repay:
 *   post:
 *     summary: Repay a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Repayment successful
 *       404:
 *         description: Loan not found
 */
router.post('/:id/repay', auth, loanController.repayLoan);

/**
 * @swagger
 * /api/loans/{id}/toggle-auto-payment:
 *   post:
 *     summary: Toggle automatic payment for a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Automatic payment toggled
 *       404:
 *         description: Loan not found
 */
router.post('/:id/toggle-auto-payment', auth, loanController.toggleAutoPayment);

module.exports = router;