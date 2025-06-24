module.exports = (req, res, next) => {
  // Make sure user is authenticated and is an admin
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};