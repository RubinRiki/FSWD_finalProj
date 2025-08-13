 
const express = require('express');
const router = express.Router();
const controller = require('../controllers/assignmentController');

router.get('/', controller.getAssignmentsController);

module.exports = router;
