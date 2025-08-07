const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/courses/teaching → get courses created by the logged-in teacher
router.get('/teaching', authMiddleware, courseController.getCoursesByTeacher);

module.exports = router;
