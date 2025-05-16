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
 * /api/savings/goals:
 *   get:
 *     summary: Get all savings goals
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of savings goals
 */


router.post('/create-goal', auth, savingsController.createGoal);
router.get('/goals', auth, savingsController.getUserGoals);
router.post('/deposit', auth, savingsController.depositToGoal);
router.post('/withdraw', auth, savingsController.withdrawFromGoal);

module.exports = router;
