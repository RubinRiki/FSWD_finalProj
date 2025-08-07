const jwtUtils = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
   // DEV MODE: use fixed user ID
  req.user = { id: '1cbe7a6e-8f91-4b7f-bdc7-2acbc17f8459' }; // ← replace with your actual user ID
  return next();

 /*  const authHeader = req.headers.authorization;
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
  } */
};

module.exports = authMiddleware;