const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');
const courseController = require('../controllers/courseController');

router.use(auth);
router.get('/list', courseController.getCoursesForUserController);
router.post('/', requireRole('teacher'), courseController.createCourseController);
router.get('/:id/details', courseController.getCourseDetailsController);


module.exports = router;