const svc = require('../services/submissionService');

const requester = (req) => ({
  userId: req.auth?.userId || req.user?.sub || req.user?._id || req.user?.id,
  role:   req.auth?.role   || req.user?.role
});

async function getSubmissions(req, res, next) {
  try {
    const { assignment, sort, page, limit } = req.query;
    const out = await svc.listSubmissionsForAssignment({ assignment, sort, page, limit, requester: requester(req) });
    res.json({ data: out.items, meta: { total: out.total, page: out.page, limit: out.limit } });
  } catch (err) {
    if (err.message === 'assignment is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function bulkUpdateSubmissions(req, res, next) {
  try {
    const { assignment, updates } = req.body || {};
    const out = await svc.bulkUpdateSubmissions({ assignment, updates, requester: requester(req) });
    res.json({ data: { updated: out.updated } });
  } catch (err) {
    if (err.message === 'assignment is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function uploadSubmission(req, res, next) {
  try {
    const { assignment, note = '' } = req.body || {};
    const { originalname, filename } = req.file || {};
    const userId = requester(req).userId;
    if (!assignment) return res.status(400).json({ error: 'assignment is required' });
    if (!req.file)   return res.status(400).json({ error: 'file is required' });

    const doc = await svc.saveSubmissionFromUpload({
      studentId: userId,
      assignmentId: assignment,
      savedFilename: filename,
      originalName: originalname || filename,
      note
    });
    res.json({ data: doc });
  } catch (err) { next(err); }
}

async function serveSubmissionFile(req, res, next) {
  try {
    const { absPath, downloadName } = await svc.getSubmissionFilePath({ submissionId: req.params.id, requester: requester(req) });
    const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
    res.sendFile(absPath);
  } catch (err) {
    const status = err.status || 500;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function deleteSubmission(req, res, next) {
  try {
    await svc.deleteSubmission({ id: req.params.id, requester: requester(req) });
    res.json({ data: { deleted: true } });
  } catch (err) {
    const status = err.status || 500;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  getSubmissions,
  bulkUpdateSubmissions,
  uploadSubmission,
  serveSubmissionFile,
  deleteSubmission
};
