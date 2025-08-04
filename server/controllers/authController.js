
const authService = require('../services/authService');

/**
 * Register new user controller
 */
exports.registerController = async (req, res) => {
  try {
    const newUser = await authService.register(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    // TODO: Handle errors like user already exists
    res.status(400).json({ message: error.message });
  }
};

/**
 * Login user controller
 */
exports.loginController = async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    res.json({ user, token });
  } catch (error) {
    // TODO: Handle authentication failure (invalid credentials)
    res.status(401).json({ message: error.message });
  }
};
