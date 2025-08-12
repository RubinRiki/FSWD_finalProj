const jwtUtils = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwtUtils.verifyToken(m[1]);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;