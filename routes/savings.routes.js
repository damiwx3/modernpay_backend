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

// Create a new savings goal
router.post('/create-goal', auth, savingsController.createGoal);

// Get all savings goals for the user
router.get('/goals', auth, savingsController.getUserGoals);

// Get a single savings goal by ID
router.get('/goals/:id', auth, savingsController.getGoalById);

// Update a savings goal
router.put('/goals/:id', auth, savingsController.updateGoal);

// Delete a savings goal
router.delete('/goals/:id', auth, savingsController.deleteGoal);

// Mark a goal as completed
router.post('/goals/:id/complete', auth, savingsController.completeGoal);

// Deposit money from wallet to savings goal
router.post('/deposit', auth, savingsController.depositToGoal);

// Withdraw money from savings goal to wallet
router.post('/withdraw', auth, savingsController.withdrawFromGoal);

module.exports = router;