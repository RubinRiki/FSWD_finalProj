exports.requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};