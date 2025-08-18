const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');
const controller = require('../controllers/assignmentController');

router.get('/', requireAuth, requireRole('teacher'), controller.getAssignmentsController);
router.get('/:id', requireAuth, requireRole('teacher'), controller.getAssignmentByIdController);
router.post('/', requireAuth, requireRole('teacher'), controller.createAssignmentController);
router.patch('/:id', requireAuth, requireRole('teacher'), controller.updateAssignmentController);
router.delete('/:id', requireAuth, requireRole('teacher'), controller.deleteAssignmentController);

module.exports = router;
