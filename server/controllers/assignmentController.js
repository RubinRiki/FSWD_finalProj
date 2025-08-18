const service = require('../services/assignmentService');

async function getAssignmentsController(req, res, next) {
  try {
    const { course, sort, page, limit, fields } = req.query;
    const result = await service.listAssignmentsForCourse({ course, sort, page, limit, fields });
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    if (err.message === 'course is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function getAssignmentByIdController(req, res, next) {
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

async function createAssignmentController(req, res, next) {
  try {
    const { courseId, title, description, dueDate } = req.body || {};
    const data = await service.createAssignment({ courseId, title, description, dueDate });
    res.status(201).json({ data });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function updateAssignmentController(req, res, next) {
  try {
    const data = await service.updateAssignment({ id: req.params.id, payload: req.body || {} });
    res.json({ data });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

async function deleteAssignmentController(req, res, next) {
  try {
    await service.deleteAssignment({ id: req.params.id });
    res.json({ data: { deleted: true } });
  } catch (err) {
    const status = err.status || 400;
    if (status !== 500) return res.status(status).json({ error: err.message });
    next(err);
  }
}

module.exports = {
  getAssignmentsController,
  getAssignmentByIdController,
  createAssignmentController,
  updateAssignmentController,
  deleteAssignmentController
};
