const db = require('../models'); // Adjust if your Notification model is elsewhere

// Example Notification model: { id, userId, message, read, createdAt }

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

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.Notification.update({ read: true }, { where: { userId, read: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

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