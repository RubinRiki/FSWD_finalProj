const mongoose   = require('mongoose');
const Course     = require('../models/Course');      // { createdBy, title, description, ... }
const Enrollment = require('../models/Enrollment');  // { studentId, courseId }
const Assignment = require('../models/Assignment');  // { studentId, courseId }
const User       = require('../models/User');        // { name, email, ... }

const { countAssignmentsByCourseIds } = require('./assignmentService');

const toOid  = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);
const esc    = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sortOf = (s) =>
  s === 'title'      ? { title: 1 }  :
  s === '-title'     ? { title: -1 } :
  s === 'createdAt'  ? { createdAt: 1 } :
                       { createdAt: -1 }; // default: newest first

/**
 * Fetch a thin list of courses the UI needs (title, updatedAt, _id),
 * filtered by role:
 * - student: all courses the student is enrolled in
 * - teacher: all courses created by the teacher
 * Applies search (q), sort, and limit.
 */
async function fetchCoursesByRole({ userId, role, limit = 12, q = '', sort = '-createdAt' }) {
  const by  = toOid(userId);
  const rx  = q.trim() ? new RegExp(esc(q.trim()), 'i') : null;
  const srt = sortOf(sort);
  limit     = Math.min(Math.max(parseInt(limit) || 12, 1), 100);

  if (role === 'student') {
    // Get course IDs from enrollments
    const enrolls = await Enrollment.find({ studentId: by }).select('courseId').lean();
    const ids = enrolls.map(e => e.courseId).filter(Boolean);
    if (ids.length === 0) return [];

    const filter = { _id: { $in: ids }, ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) };
    return Course.find(filter)
      .sort(srt)
      .limit(limit)
      .select('title updatedAt') // thin projection
      .lean();
  }

  // Teacher flow
  const filter = { createdBy: by, ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) };
  return Course.find(filter)
    .sort(srt)
    .limit(limit)
    .select('title updatedAt')   // thin projection
    .lean();
}

/**
 * For the given course list, attach assignment counts in one go.
 * Returns normalized items the UI can render directly.
 */
async function attachAssignmentCounts(courses) {
  const ids  = courses.map(c => c._id);
  const cmap = await countAssignmentsByCourseIds(ids); // Map(courseId -> count)

  return courses.map(c => ({
    _id: c._id,
    title: c.title,
    updatedAt: c.updatedAt,
    count: cmap.get(String(c._id)) || 0
  }));
}

/**
 * Public API:
 * One flow for both roles.
 * - No pagination (as requested)
 * - Supports limit, q (search), and sort
 * - Always returns count = total assignments per course
 */
async function listCoursesForUser({ userId, role, limit, q, sort }) {
  const courses = await fetchCoursesByRole({ userId, role, limit, q, sort });
  if (courses.length === 0) return { data: [] };

  const data = await attachAssignmentCounts(courses);
  return { data };
}

async function createCourse(teacherId, { title, description = '' }) {
  const doc = await Course.create({
    title: title.trim(),
    description: description.trim(),
    createdBy: toOid(teacherId),
  });
  return {
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
async function getCourseDetails({ userId, role, courseId, withStats = false }) {
  const uId = toOid(userId);
  const cId = toOid(courseId);

  const course = await Course.findById(cId)
    .populate({ path: 'createdBy', select: 'name email', model: User })
    .lean();

  if (!course) {
    const err = new Error('Course not found');
    err.status = 404;
    throw err;
  }

  if (role === 'teacher') {
    const ownerId = String(course.createdBy?._id || course.createdBy);
    if (ownerId !== String(uId)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
  } else {
    const enrolled = await Enrollment.exists({ courseId: cId, studentId: uId });
    if (!enrolled) {
      const err = new Error('Not enrolled');
      err.status = 403;
      throw err;
    }
  }

  const data = {
    _id:        course._id,
    title:      course.title,
    description:course.description || '',
    createdAt:  course.createdAt,
    updatedAt:  course.updatedAt,
    createdBy:  course.createdBy
      ? { _id: course.createdBy._id, name: course.createdBy.name, email: course.createdBy.email }
      : undefined,
    permissions: {
      canEditCourse:       role === 'teacher',
      canCreateAssignment: role === 'teacher',
      canViewStudents:     role === 'teacher',
      canViewSubmissions:  role === 'teacher',
      canDeleteCourse:     role === 'teacher',
    }
  };

  if (withStats) {
    const now = new Date();
    const [assignments, students, upcoming] = await Promise.all([
      Assignment.countDocuments({ courseId: cId }),
      Enrollment.countDocuments({ courseId: cId }),
      Assignment.countDocuments({ courseId: cId, dueDate: { $gte: now } }),
    ]);
    data.stats = { assignments, students, upcoming };
  }

  return data;
};
module.exports = {
  listCoursesForUser,
  createCourse,
  getCourseDetails
};
