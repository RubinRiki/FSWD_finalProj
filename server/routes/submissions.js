const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roles');

const { upload } = require('../middleware/uploadMiddleware');
const controller = require('../controllers/submissionController');

router.get('/', requireAuth, requireRole('teacher'), controller.getSubmissionsController);
router.patch('/bulk', requireAuth, requireRole('teacher'), controller.bulkUpdateSubmissionsController);

router.post('/upload', requireAuth, requireRole('student'), upload.single('file'), controller.uploadSubmissionController);
router.get('/:id/file', requireAuth, controller.serveSubmissionFileController);

module.exports = router;
