const service = require('../services/assignmentService');

const authCtx = (req) => ({
  userId: req.auth?.userId || req.user?.sub || req.user?._id || req.user?.id,
  role:   req.auth?.role   || req.user?.role
});

async function listAssignments(req, res, next) {
  try {
    const { course, sort, page, limit, fields } = req.query;
    const out = await service.listAssignmentsForCourse({ course, sort, page, limit, fields });
    res.json({ data: out.items, meta: { total: out.total, page: out.page, limit: out.limit } });
  } catch (err) {
    if (err.message === 'course is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}
async function listAssignmentsDueThisWeek(req, res, next) {
  try {
    const studentId = req.auth?.userId || req.user?.id || req.user?._id;
    const { limit } = req.query;
    const data = await service.listAssignmentsDueThisWeek({ studentId, limit });
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function getAssignment(req, res, next) {
  try {
    const { fields, include } = req.query;
    const data = await service.getAssignmentById({ id: req.params.id, fields, include });
    res.json({ data });
  } catch (err) {
    const status = err.status || 500;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function createAssignment(req, res, next) {
  try {
    const { courseId, title, description, dueDate } = req.body || {};
    const data = await service.createAssignment({
      courseId, title, description, dueDate, requester: authCtx(req)
    });
    res.status(201).json({ data });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const data = await service.updateAssignment({
      id: req.params.id,
      payload: req.body || {},
      requester: authCtx(req)
    });
    res.json({ data });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    await service.deleteAssignment({ id: req.params.id, requester: authCtx(req) });
    res.json({ data: { deleted: true } });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentsDueThisWeek
};
