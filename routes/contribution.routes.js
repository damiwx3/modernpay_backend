// routes/contribution.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/contribution.controller');
const auth = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Contributions
 *   description: Group contribution endpoints
 */

/**
 * @swagger
 * /api/contributions/groups:
 *   post:
 *     summary: Create a new contribution group
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amountPerMember
 *             properties:
 *               name:
 *                 type: string
 *               amountPerMember:
 *                 type: number
 *     responses:
 *       201:
 *         description: Group created
 */
router.post('/groups', auth, controller.createGroup);

/**
 * @swagger
 * /api/contributions/groups:
 *   get:
 *     summary: Get all contribution groups
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/groups', auth, controller.getGroups);

/**
 * @swagger
 * /api/contributions/groups/{groupId}/join:
 *   post:
 *     summary: Join a contribution group
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined group
 */
router.post('/groups/:groupId/join', auth, controller.joinGroup);

/**
 * @swagger
 * /api/contributions/groups/{groupId}/members:
 *   get:
 *     summary: List members in a group
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Members retrieved
 */
router.get('/groups/:groupId/members', auth, controller.getMembers);

module.exports = router;


// controllers/contribution.controller.js
const db = require('../models');

exports.createGroup = async (req, res) => {
  try {
    const { name, amountPerMember } = req.body;
    const group = await db.ContributionGroup.create({ name, amountPerMember });
    res.status(201).json({ message: 'Group created', group });
  } catch (err) {
    res.status(500).json({ message: 'Create group failed', error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await db.ContributionGroup.findAll();
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const existing = await db.ContributionMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (existing) return res.status(400).json({ message: 'Already joined' });

    const member = await db.ContributionMember.create({
      userId: req.user.id,
      groupId
    });
    res.status(200).json({ message: 'Joined group', member });
  } catch (err) {
    res.status(500).json({ message: 'Join failed', error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const members = await db.ContributionMember.findAll({
      where: { groupId: req.params.groupId },
      include: [{ model: db.User, attributes: ['fullName', 'email'] }]
    });
    res.status(200).json({ members });
  } catch (err) {
    res.status(500).json({ message: 'Fetch members failed', error: err.message });
  }
};
