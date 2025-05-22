const express = require('express');
const router = express.Router();
const controller = require('../controllers/contribution.controller');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');

// Setup Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/groups');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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
 *         multipart/form-data:
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
 *               frequency:
 *                 type: string
 *                 enum: [Daily, Weekly, Monthly]
 *               payoutSchedule:
 *                 type: string
 *               description:
 *                 type: string
 *               maxMembers:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Group created
 */
router.post('/groups', auth, upload.single('image'), controller.createGroup);

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

/**
 * @swagger
 * /api/contributions/scheduler/trigger:
 *   post:
 *     summary: Trigger contribution scheduler manually
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler ran successfully
 */
router.post('/scheduler/trigger', auth, controller.runScheduler);

/**
 * @swagger
 * /api/contributions/groups/{groupId}/payout:
 *   post:
 *     summary: Trigger payout for a group
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
 *         description: Payout processed
 */
router.post('/groups/:groupId/payout', auth, controller.processPayout);

// ...existing code...

/**
 * @swagger
 * /api/contributions/groups/{groupId}/leave:
 *   post:
 *     summary: Leave a contribution group
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
 *         description: Left group successfully
 */
router.post('/groups/:groupId/leave', auth, controller.leaveGroup);

/**
 * @swagger
 * /api/contributions/contribute:
 *   post:
 *     summary: Make a contribution to a cycle
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
 *               - cycleId
 *               - amount
 *             properties:
 *               cycleId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Contribution made
 */
router.post('/contribute', auth, controller.makeContribution);

// ...existing code...

/**
 * @swagger
 * /api/contributions/groups/{groupId}/summary:
 *   get:
 *     summary: Get group summary and history
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
 *         description: Group summary returned
 */
router.get('/groups/:groupId/summary', auth, controller.getGroupSummary);

module.exports = router;
