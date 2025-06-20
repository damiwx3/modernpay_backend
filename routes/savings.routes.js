const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savings.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Savings
 *   description: Savings goals and tracking
 */

/**
 * @swagger
 * /api/savings/create-goal:
 *   post:
 *     summary: Create a new savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Savings goal created
 */
router.post('/create-goal', auth, savingsController.createGoal);

/**
 * @swagger
 * /api/savings/goals:
 *   get:
 *     summary: Get all savings goals for the user
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of savings goals
 */
router.get('/goals', auth, savingsController.getUserGoals);

/**
 * @swagger
 * /api/savings/goals/{id}:
 *   get:
 *     summary: Get a single savings goal by ID
 *     tags: [Savings]
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
 *         description: Savings goal details
 *       404:
 *         description: Goal not found
 */
router.get('/goals/:id', auth, savingsController.getGoalById);

/**
 * @swagger
 * /api/savings/goals/{id}:
 *   put:
 *     summary: Update a savings goal
 *     tags: [Savings]
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
 *               title:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Goal updated
 *       404:
 *         description: Goal not found
 */
router.put('/goals/:id', auth, savingsController.updateGoal);

/**
 * @swagger
 * /api/savings/goals/{id}:
 *   delete:
 *     summary: Delete a savings goal
 *     tags: [Savings]
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
 *         description: Goal deleted
 *       404:
 *         description: Goal not found
 */
router.delete('/goals/:id', auth, savingsController.deleteGoal);

/**
 * @swagger
 * /api/savings/goals/{id}/complete:
 *   post:
 *     summary: Mark a goal as completed
 *     tags: [Savings]
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
 *         description: Goal marked as completed
 *       404:
 *         description: Goal not found
 */
router.post('/goals/:id/complete', auth, savingsController.completeGoal);

/**
 * @swagger
 * /api/savings/deposit:
 *   post:
 *     summary: Deposit money from wallet to savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goalId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 *       400:
 *         description: Invalid deposit amount or insufficient balance
 *       404:
 *         description: Savings goal not found
 */
router.post('/deposit', auth, savingsController.depositToGoal);

/**
 * @swagger
 * /api/savings/withdraw:
 *   post:
 *     summary: Withdraw money from savings goal to wallet
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goalId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Invalid withdrawal amount or insufficient savings
 *       404:
 *         description: Savings goal not found
 */
router.post('/withdraw', auth, savingsController.withdrawFromGoal);

module.exports = router;