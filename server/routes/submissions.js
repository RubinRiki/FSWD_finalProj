const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/submissionController');
const { upload } = require('../middleware/uploadMiddleware');

router.use(requireAuth);

// list (role-scoped)
router.get('/', ctrl.getSubmissions);

// bulk grade (teacher only)
router.patch('/bulk', requireRole('teacher'), ctrl.bulkUpdateSubmissions);

// upload (student only)
router.post('/upload', requireRole('student'), upload.single('file'), ctrl.uploadSubmission);

// file serve (auth, service authorizes)
router.get('/:id/file', ctrl.serveSubmissionFile);

// delete (owner student or teacher-owner-of-course)
router.delete('/:id', ctrl.deleteSubmission);

module.exports = router;
