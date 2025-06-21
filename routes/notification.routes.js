const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');
const { androidApp, iosApp } = require('../config/firebase');

router.use(auth);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', controller.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 */
router.get('/unread-count', controller.getUnreadCount);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark all notifications as read for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/mark-read', controller.markAllRead);

/**
 * @swagger
 * /api/notifications/{id}/mark-read:
 *   post:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.post('/:id/mark-read', controller.markOneRead);
router.get('/', auth, controller.getUserNotifications);

module.exports = router;