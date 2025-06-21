const db = require('../models');
const { androidApp, iosApp } = require('../config/firebase');

// Example Notification model: { id, userId, message, read, createdAt }

// 1. Get all notifications for the user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await db.Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// 2. Get unread notifications for the user
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await db.Notification.findAll({
      where: { userId, read: false },
      order: [['createdAt', 'DESC']],
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unread notifications' });
  }
};

// 3. Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await db.Notification.count({
      where: { userId, read: false },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

// 4. Mark all notifications as read
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.Notification.update({ read: true }, { where: { userId, read: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

// 5. Mark one notification as read
exports.markOneRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.Notification.update({ read: true }, { where: { id, userId } });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// 6. Delete one notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.Notification.destroy({ where: { id, userId } });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// 7. Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.Notification.destroy({ where: { userId } });
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete all notifications' });
  }
};
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await db.Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 8. Create/send a notification (for system use, now with push support)
exports.createNotification = async (req, res) => {
  try {
    const userId = req.body.userId || req.user.id;
    const { title, message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Save in-app notification
    const notification = await db.Notification.create({
      userId,
      title: title || 'Notification',
      message,
      read: false,
    });

    // Send push notification if user has deviceToken and platform
    const user = await db.User.findByPk(userId);
    if (user && user.deviceToken && user.platform) {
      const firebaseApp = user.platform === 'ios' ? iosApp : androidApp;
      const payload = {
        notification: {
          title: title || 'Notification',
          body: message,
        },
        data: {
          notificationId: notification.id.toString(),
        }
      };
      try {
        await firebaseApp.messaging().send({
          token: user.deviceToken,
          ...payload,
        });
      } catch (pushErr) {
        console.error('Push notification error:', pushErr.message);
      }
    }

    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create notification' });
  }
};