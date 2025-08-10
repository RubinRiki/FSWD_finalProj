// controllers/authController.js
const authService = require('../services/authService');

/**
 * Controller: Register new user
 */
exports.registerController = async (req, res) => {
  try {
    const { token, user } = await authService.register(req.body);
    res.status(201).json({ token, user });
  } catch (error) {
    // Keep error key consistent for the client
    res.status(400).json({ error: error.message });
  }
};

/**
 * Controller: Login user
 */
exports.loginController = async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    res.json({ user, token });
  } catch (error) {
    // Keep error key consistent for the client
    res.status(401).json({ error: error.message });
  }
};
