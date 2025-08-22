const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/courseController');
const { enrollNowController, requestEnrollController, leaveCourseController } = require('../controllers/enrollmentController');

router.use(requireAuth);

router.get('/list', ctrl.getCoursesForUserController);
router.get('/catalog', ctrl.getCatalogController);

router.post('/', requireRole('teacher'), ctrl.createCourseController);

router.get('/:id', ctrl.getCourseController);
router.get('/:id/details', ctrl.getCourseController);

router.get('/:id/students', requireRole('teacher'), ctrl.getStudentsOfCourseController);

router.patch('/:id', requireRole('teacher'), ctrl.updateCourseController);
router.delete('/:id', requireRole('teacher'), ctrl.deleteCourseController);

router.post('/:courseId/enroll', requireRole('student'), enrollNowController);
router.post('/:courseId/enroll/request', requireRole('student'), requestEnrollController);
router.delete('/:courseId/enroll', requireRole('student'), leaveCourseController);

module.exports = router;
