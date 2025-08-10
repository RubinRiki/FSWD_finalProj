// services/authService.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtUtils');

/**
 * Registers a new user.
 * Expects: { name? , fullName? , email, password, role }
 * Stores hashed password in `passwordHash` and standardizes name.
 */
const register = async (userData) => {
  const { name, fullName, email, password, role = 'student' } = userData;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name || fullName, // accept legacy "fullName" from client
    email,
    role,
    passwordHash
  });

  const token = generateToken({ sub: user._id.toString(), role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

/**
 * Logs in an existing user.
 * Expects: (email, password)
 * Loads `passwordHash` explicitly and compares with bcrypt.
 */
const login = async (email, password) => {
  if (!email || !password) throw new Error('Email and password are required');

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  const token = generateToken({ sub: user._id.toString(), role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

module.exports = { register, login };
