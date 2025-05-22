const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticket.controller');
const auth = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin_auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Support ticket system
 */

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: User creates a support ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         description: Bad request
 */
router.post('/', auth, controller.createTicket);

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Get logged-in user's support tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets retrieved
 */
router.get('/my', auth, controller.getUserTickets);

/**
 * @swagger
 * /api/tickets/admin:
 *   get:
 *     summary: Admin view of all support tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tickets retrieved
 */
router.get('/admin', adminAuth, controller.getAllTickets);

/**
 * @swagger
 * /api/tickets/admin/{id}/respond:
 *   put:
 *     summary: Admin responds to a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *     responses:
 *       200:
 *         description: Ticket updated
 *       404:
 *         description: Ticket not found
 */
router.put('/admin/:id/respond', adminAuth, controller.respondToTicket);

module.exports = router;