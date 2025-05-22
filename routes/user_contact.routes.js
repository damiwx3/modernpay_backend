const express = require('express');
const router = express.Router();
const controller = require('../controllers/user_contact.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Add a user contact for peer-to-peer transactions
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactUserId
 *             properties:
 *               contactUserId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Contact added
 */
router.post('/', auth, controller.addContact);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: List all user contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contacts
 */
router.get('/', auth, controller.getContacts);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   delete:
 *     summary: Remove a user contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact removed
 *       404:
 *         description: Contact not found
 */
router.delete('/:contactId', auth, controller.removeContact);

module.exports = router;