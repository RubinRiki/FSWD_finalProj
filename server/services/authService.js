const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (userData) => {
  // TODO: Check if user with given email already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // TODO: Hash the user's password before saving
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  userData.password = hashedPassword;

  // TODO: Create and save the new user
  const newUser = new User(userData);
  await newUser.save();

  return newUser;
};

const login = async (email, password) => {
  // TODO: Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // TODO: Compare provided password with hashed password in DB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // TODO: Generate JWT token for authenticated user
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { user, token };
};

module.exports = {
  register,
  login,
};
