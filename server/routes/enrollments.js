 const express = require('express');
const router = express.Router();
const controller = require('../controllers/enrollmentController');

router.get('/', controller.getEnrollmentsController);

module.exports = router;
