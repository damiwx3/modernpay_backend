const express = require('express');
const router = express.Router();
const controller = require('../controllers/dispute.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Raise a dispute for a transaction
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dispute raised
 */
router.post('/', auth, controller.raiseDispute);

/**
 * @swagger
 * /api/disputes:
 *   get:
 *     summary: Admin - Get all disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of disputes
 */
router.get('/', auth, controller.getAllDisputes);

/**
 * @swagger
 * /api/disputes/my:
 *   get:
 *     summary: Get my disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my disputes
 */
router.get('/my', auth, controller.getMyDisputes);

/**
 * @swagger
 * /api/disputes/{id}/resolve:
 *   post:
 *     summary: Resolve a dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.post('/:id/resolve', auth, controller.resolveDispute);

/**
 * @swagger
 * /api/disputes/{id}:
 *   patch:
 *     summary: Update dispute status
 *     tags: [Disputes]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute updated
 */
router.patch('/:id', auth, controller.updateDispute);
router.get('/', auth, controller.getUserDisputes);
router.post('/', auth, controller.createDispute);

module.exports = router;