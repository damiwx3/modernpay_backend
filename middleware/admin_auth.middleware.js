const jwt = require('jsonwebtoken');
const db = require('../models');

// Admin authentication middleware
module.exports = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Admin token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await db.AdminUser.findByPk(decoded.id);

    if (!admin) {
      return res.status(403).json({ message: 'Admin access denied' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
