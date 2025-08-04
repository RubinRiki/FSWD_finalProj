const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/login', authController.loginController);
router.post('/register', authController.registerController);


// TODO: Example of using authMiddleware to protect a route that requires authentication
router.get('/private', authMiddleware, (req, res) => {
  res.json({ message: 'This is a private route', user: req.user });
});


module.exports = router;
