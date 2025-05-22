const express = require('express');
const router = express.Router();
const controller = require('../controllers/contribution_cycle.controller');

/**
 * @swagger
 * tags:
 *   name: ContributionCycles
 *   description: Manage contribution cycles
 */

/**
 * @swagger
 * /api/contribution-cycles:
 *   get:
 *     summary: Get all contribution cycles
 *     tags: [ContributionCycles]
 *     responses:
 *       200:
 *         description: List of contribution cycles
 */
router.get('/', controller.getAllCycles);

/**
 * @swagger
 * /api/contribution-cycles/{id}:
 *   get:
 *     summary: Get a contribution cycle by ID
 *     tags: [ContributionCycles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Contribution cycle ID
 *     responses:
 *       200:
 *         description: Contribution cycle found
 *       404:
 *         description: Contribution cycle not found
 */
router.get('/:id', controller.getCycleById);

/**
 * @swagger
 * /api/contribution-cycles:
 *   post:
 *     summary: Create a new contribution cycle
 *     tags: [ContributionCycles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - startDate
 *               - endDate
 *             properties:
 *               groupId:
 *                 type: integer
 *               cycleNumber:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Contribution cycle created
 *       400:
 *         description: Invalid input
 */
router.post('/', controller.createCycle);

module.exports = router;