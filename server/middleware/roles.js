// Simple role guards based on req.auth.role

function requireRole(role) {
  return (req, res, next) => {
    const r = req.auth?.role || req.user?.role; // tolerate legacy
    if (r === role) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

function requireAnyRole(roles = []) {
  return (req, res, next) => {
    const r = req.auth?.role || req.user?.role;
    if (roles.includes(r)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { requireRole, requireAnyRole };
