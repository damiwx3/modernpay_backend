const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.post('/mark-read', controller.markAllRead);
router.post('/:id/mark-read', controller.markOneRead);

module.exports = router;