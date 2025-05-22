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
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Loan application submitted
 *       400:
 *         description: Invalid request
 */

router.post('/apply', auth, loanController.applyForLoan);
router.get('/my-loans', auth, loanController.getUserLoans);
router.get('/:id', auth, loanController.getLoanById);

module.exports = router;
