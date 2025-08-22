const {
  listEnrollmentsForCourse,
  enrollNow,
  requestEnroll,
  leaveCourse,
  listPendingRequestsForTeacher,
  approveEnrollment,
  rejectEnrollment
} = require('../services/enrollmentService');

async function getEnrollmentsController(req, res, next) {
  try {
    const { course, sort, page, limit } = req.query;
    const result = await listEnrollmentsForCourse({ course, sort, page, limit });
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    if (err.message === 'course is required') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function enrollNowController(req, res, next) {
  try {
    const { courseId } = req.params;
    const studentId = req.auth.userId;
    const out = await enrollNow({ courseId, studentId });
    res.status(200).json({ data: out });
  } catch (err) { next(err); }
}

async function requestEnrollController(req, res, next) {
  try {
    const { courseId } = req.params;
    const studentId = req.auth.userId;
    const out = await requestEnroll({ courseId, studentId });
    res.status(200).json({ data: out });
  } catch (err) { next(err); }
}

async function leaveCourseController(req, res, next) {
  try {
    const { courseId } = req.params;
    const studentId = req.auth.userId;
    await leaveCourse({ courseId, studentId });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function listPendingRequestsController(req, res, next) {
  try {
    const teacherId = req.auth.userId;
    const { sort, page, limit } = req.query;
    const result = await listPendingRequestsForTeacher({ teacherId, sort, page, limit });
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) { next(err); }
}

async function approveEnrollmentController(req, res, next) {
  try {
    const teacherId = req.auth.userId;
    await approveEnrollment({ enrollmentId: req.params.id, teacherId });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function rejectEnrollmentController(req, res, next) {
  try {
    const teacherId = req.auth.userId;
    await rejectEnrollment({ enrollmentId: req.params.id, teacherId });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = {
  getEnrollmentsController,
  enrollNowController,
  requestEnrollController,
  leaveCourseController,
  listPendingRequestsController,
  approveEnrollmentController,
  rejectEnrollmentController
};
