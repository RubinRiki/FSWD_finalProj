const submissionService = require('../services/submissionService');

async function getSubmissionsController(req, res, next) {
  try {
    const { assignment, sort, page, limit } = req.query;
    const result = await submissionService.listSubmissionsForAssignment({ assignment, sort, page, limit });
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    if (err.message === 'assignment is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function bulkUpdateSubmissionsController(req, res, next) {
  try {
    const { assignment, updates } = req.body || {};
    const result = await submissionService.bulkUpdateSubmissions({ assignment, updates });
    res.json({ data: { updated: result.updated } });
  } catch (err) {
    if (err.message === 'assignment is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}
async function uploadSubmissionController(req, res, next) {
  try {
    const studentId = req.user._id || req.user.id;
    const { assignment, note = '' } = req.body || {};
    if (!assignment) return res.status(400).json({ error: 'assignment is required' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const doc = await submissionService.saveSubmissionFromUpload({
      studentId,
      assignmentId: assignment,
      savedFilename: req.file.filename,
      note
    });
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
}

async function serveSubmissionFileController(req, res, next) {
  try {
    const { absPath, downloadName } = await submissionService.getSubmissionFilePath({
      submissionId: req.params.id,
      requester: req.user
    });
    const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
    res.sendFile(absPath);
  } catch (err) {
    const status = err.status || 500;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  getSubmissionsController,
  bulkUpdateSubmissionsController,
  uploadSubmissionController,
  serveSubmissionFileController
};
