 
const { listAssignmentsForCourse } = require('../services/assignmentService');

async function getAssignmentsController(req, res, next) {
  try {
    const { course, sort, page, limit } = req.query;
    const result = await listAssignmentsForCourse({ course, sort, page, limit });
    const data = result.items.map(a => ({ ...a, submitted: 0 }));
    res.json({ data, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    if (err.message === 'course is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { getAssignmentsController };
