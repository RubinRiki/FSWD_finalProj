// utils/jwtUtils.js
const jwt = require('jsonwebtoken');

/**
 * Generates a JWT with a standard payload shape { sub, role }.
 * Uses a 7-day expiration by default.
 */
function generateToken({ sub, role }) {
  return jwt.sign({ sub, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT and returns the decoded payload.
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
