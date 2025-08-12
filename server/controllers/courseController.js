const courseService = require('../services/courseService');

async function getCoursesForUserController(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.sub;
    const role   = req.user?.role === 'student' ? 'student' : 'teacher'; // default: teacher
    const { limit, q, sort } = req.query;

    const result = await courseService.listCoursesForUser({ userId, role, limit, q, sort });
    res.json(result); // { data: [{ _id, title, updatedAt, count }] }
  } catch (e) {
    next(e);
  }
}
async function createCourseController(req, res, next) {
  try {
    const teacherId = req.user?.sub || req.user?._id || req.user?.id;
    const { title, description = '' } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const data = await courseService.createCourse(teacherId, { title, description });
    res.status(201).json({ data });
  } catch (e) { next(e); }
};

async function getCourseDetailsController(req, res, next) {
  try {
    console.log("in controller", req.params);

    const userId = req.user?.sub || req.user?._id || req.user?.id;
    const role = req.user?.role === 'student' ? 'student' : 'teacher';
    const { id } = req.params;
    const include = String(req.query.include || '');
    const withStats = include.includes('stats');

    const data = await courseService.getCourseDetails({ userId, role, courseId: id, withStats });
    return res.json({ data });
  } catch (e) { next(e); }
}


module.exports = {
   getCoursesForUserController,
   createCourseController,
   getCourseDetailsController
  };
