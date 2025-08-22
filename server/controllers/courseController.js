const svc = require('../services/courseService');

function authCtx(req) {
  return {
    userId: req.auth?.userId || req.user?.sub || req.user?._id || req.user?.id,
    role: req.auth?.role || req.user?.role
  };
}

async function getCoursesForUserController(req, res, next) {
  try {
    const { userId, role } = authCtx(req);
    const { limit, q, sort } = req.query;
    const result = await svc.listCoursesForUser({ userId, role, limit, q, sort });
    res.json(result);
  } catch (e) { next(e); }
}

async function createCourseController(req, res, next) {
  try {
    const { userId } = authCtx(req);
    const { title, description = '' } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const data = await svc.createCourse(userId, { title, description });
    res.status(201).json({ data });
  } catch (e) { next(e); }
}

async function getCourseController(req, res, next) {
  try {
    const { userId, role } = authCtx(req);
    const include = String(req.query.include || '');
    const withStats = include.includes('stats');
    const data = await svc.getCourseDetails({ userId, role, courseId: req.params.id, withStats });
    res.json({ data });
  } catch (e) { next(e); }
}

async function getStudentsOfCourseController(req, res, next) {
  try {
    const { userId, role } = authCtx(req);
    const { data } = await svc.getStudentsOfCourse({ userId, role, courseId: req.params.id });
    res.json({ data });
  } catch (e) { next(e); }
}

async function updateCourseController(req, res, next) {
  try {
    const { userId } = authCtx(req);
    const { title, description } = req.body || {};
    const data = await svc.updateCourse({ userId, courseId: req.params.id, payload: { title, description } });
    res.json({ data });
  } catch (e) { next(e); }
}

async function deleteCourseController(req, res, next) {
  try {
    const { userId } = authCtx(req);
    await svc.deleteCourse({ userId, courseId: req.params.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function getCatalogController(req, res, next) {
  try {
    const { userId } = authCtx(req);
    const { q, sort, page, limit } = req.query;
    const result = await svc.listCatalog({ userId, q, sort, page, limit });
    res.json(result);
  } catch (e) { next(e); }
}

module.exports = {
  getCoursesForUserController,
  createCourseController,
  getCourseController,
  getStudentsOfCourseController,
  updateCourseController,
  deleteCourseController,
  getCatalogController
};
