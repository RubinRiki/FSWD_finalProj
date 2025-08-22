const express = require('express');
const router = express.Router();

const controller = require('../controllers/enrollmentController');
const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');

router.use(requireAuth);

router.get('/', controller.getEnrollmentsController);

router.get('/requests', requireRole('teacher'), controller.listPendingRequestsController);
router.post('/:id/approve', requireRole('teacher'), controller.approveEnrollmentController);
router.post('/:id/reject', requireRole('teacher'), controller.rejectEnrollmentController);

module.exports = router;
