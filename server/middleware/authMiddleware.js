// Verifies JWT and exposes a single canonical identity at req.auth

const jwtUtils = require('../utils/jwtUtils');

module.exports = function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwtUtils.verifyToken(m[1]); // must verify signature & exp
    const userId = String(decoded.sub || decoded._id || decoded.id || '');
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    // Canonical auth context
    req.auth = {
      userId,
      role: decoded.role || 'student'
    };

    // Temporary shim for legacy code (safe to remove later)
    req.user = { sub: userId, _id: userId, id: userId, role: req.auth.role };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
