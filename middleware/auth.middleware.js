const jwt = require('jsonwebtoken');
const db = require('../models');

// User authentication middleware
module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};