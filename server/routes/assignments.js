const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/assignmentController');

router.use(requireAuth);

// list by course, get single
router.get('/',     ctrl.listAssignments);
router.get('/:id',  ctrl.getAssignment);

// create/update/delete (teacher-owner enforced in service)
router.post('/',        requireRole('teacher'), ctrl.createAssignment);
router.patch('/:id',    requireRole('teacher'), ctrl.updateAssignment);
router.delete('/:id',   requireRole('teacher'), ctrl.deleteAssignment);

module.exports = router;
