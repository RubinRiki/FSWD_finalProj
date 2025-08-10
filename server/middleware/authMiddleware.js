const jwtUtils = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {


  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Assuming "Bearer token..."

  try {
    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;