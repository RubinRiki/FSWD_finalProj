const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { countAssignmentsByCourseIds } = require('./assignmentService');

const toOid = v => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sortOf = s =>
  s === 'title' ? { title: 1 } :
  s === '-title' ? { title: -1 } :
  s === 'createdAt' ? { createdAt: 1 } :
  { createdAt: -1 };

async function fetchCoursesByRole({ userId, role, limit = 12, q = '', sort = '-createdAt' }) {
  const by = toOid(userId);
  const rx = q.trim() ? new RegExp(esc(q.trim()), 'i') : null;
  const srt = sortOf(sort);
  limit = Math.min(Math.max(parseInt(limit) || 12, 1), 100);

  if (role === 'student') {
    const enrolls = await Enrollment.find({ studentId: by, status: 'approved' }).select('courseId').lean();
    const ids = enrolls.map(e => e.courseId).filter(Boolean);
    if (ids.length === 0) return [];
    const filter = { _id: { $in: ids }, ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) };
    return Course.find(filter).sort(srt).limit(limit).select('title updatedAt').lean();
  }

  const filter = { createdBy: by, ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) };
  return Course.find(filter).sort(srt).limit(limit).select('title updatedAt').lean();
}

async function attachAssignmentCounts(courses) {
  const ids = courses.map(c => c._id);
  const cmap = await countAssignmentsByCourseIds(ids);
  return courses.map(c => ({
    _id: c._id,
    title: c.title,
    updatedAt: c.updatedAt,
    count: cmap.get(String(c._id)) || 0
  }));
}

async function listCoursesForUser({ userId, role, limit, q, sort }) {
  const courses = await fetchCoursesByRole({ userId, role, limit, q, sort });
  if (courses.length === 0) return { data: [] };
  const data = await attachAssignmentCounts(courses);
  return { data };
}

async function createCourse(teacherId, { title, description = '' }) {
  const doc = await Course.create({
    title: String(title).trim(),
    description: String(description || '').trim(),
    createdBy: toOid(teacherId)
  });
  return {
    _id: doc._id, title: doc.title, description: doc.description,
    createdAt: doc.createdAt, updatedAt: doc.updatedAt
  };
}

async function getCourseDetails({ userId, role, courseId, withStats = false }) {
  const uId = toOid(userId);
  const cId = toOid(courseId);

  const course = await Course.findById(cId)
    .populate({ path: 'createdBy', select: 'name email', model: User })
    .lean();
  if (!course) { const e = new Error('Course not found'); e.status = 404; throw e; }

  if (role === 'teacher') {
    const ownerId = String(course.createdBy?._id || course.createdBy);
    if (ownerId !== String(uId)) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  } else {
    const enrolled = await Enrollment.exists({ courseId: cId, studentId: uId });
    if (!enrolled) { const e = new Error('Not enrolled'); e.status = 403; throw e; }
  }

  const data = {
    _id: course._id,
    title: course.title,
    description: course.description || '',
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    createdBy: course.createdBy ? { _id: course.createdBy._id, name: course.createdBy.name, email: course.createdBy.email } : undefined,
    permissions: {
      canEditCourse: role === 'teacher',
      canCreateAssignment: role === 'teacher',
      canViewStudents: role === 'teacher',
      canViewSubmissions: role === 'teacher',
      canDeleteCourse: role === 'teacher'
    }
  };

  if (withStats) {
    const now = new Date();
    const [assignments, students, upcoming] = await Promise.all([
      Assignment.countDocuments({ courseId: cId }),
      Enrollment.countDocuments({ courseId: cId }),
      Assignment.countDocuments({ courseId: cId, dueDate: { $gte: now } })
    ]);
    data.stats = { assignments, students, upcoming };
  }
  return data;
}

async function getStudentsOfCourse({ userId, role, courseId }) {
  const cId = toOid(courseId);
  const uId = toOid(userId);

  const course = await Course.findById(cId).select('createdBy').lean();
  if (!course) { const e = new Error('Course not found'); e.status = 404; throw e; }
  if (role !== 'teacher' || String(course.createdBy) !== String(uId)) {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }

  const rows = await Enrollment.aggregate([
    { $match: { courseId: cId } },
    { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 1, student: { _id: '$student._id', name: '$student.name', email: '$student.email' } } }
  ]);
  return { data: rows };
}

async function updateCourse({ userId, courseId, payload = {} }) {
  const cId = toOid(courseId);
  const uId = toOid(userId);

  const course = await Course.findById(cId).select('createdBy').lean();
  if (!course) { const e = new Error('Course not found'); e.status = 404; throw e; }
  if (String(course.createdBy) !== String(uId)) { const e = new Error('Forbidden'); e.status = 403; throw e; }

  const allowed = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'title')) allowed.title = String(payload.title || '').trim();
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) allowed.description = String(payload.description || '');

  const doc = await Course.findByIdAndUpdate(cId, { $set: allowed }, { new: true, runValidators: true }).lean();
  return {
    _id: doc._id, title: doc.title, description: doc.description,
    createdAt: doc.createdAt, updatedAt: doc.updatedAt
  };
}

async function deleteCourse({ userId, courseId }) {
  const cId = toOid(courseId);
  const uId = toOid(userId);

  const course = await Course.findById(cId).select('createdBy').lean();
  if (!course) { const e = new Error('Course not found'); e.status = 404; throw e; }
  if (String(course.createdBy) !== String(uId)) { const e = new Error('Forbidden'); e.status = 403; throw e; }

  const hasAssignments = await Assignment.exists({ courseId: cId });
  if (hasAssignments) { const e = new Error('Course has assignments'); e.status = 409; throw e; }

  await Course.deleteOne({ _id: cId });
  return true;
}

async function listCatalog({ userId, q = '', sort = '-createdAt', page = 1, limit = 12 }) {
  const uId = toOid(userId);
  const rx = q.trim() ? new RegExp(esc(q.trim()), 'i') : null;
  const srt = sortOf(sort);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 12, 1), 100);
  const skip = (p - 1) * l;

  const rows = await Enrollment.find({ studentId: uId }).select('courseId status').lean();
  const approved = new Set(rows.filter(r => r.status === 'approved').map(r => String(r.courseId)));
  const pending = new Set(rows.filter(r => r.status === 'pending').map(r => String(r.courseId)));
  const excludeIds = Array.from(approved).map(toOid);

  const filter = { ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}), ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) };
  const [items, total] = await Promise.all([
    Course.find(filter).sort(srt).skip(skip).limit(l).select('title description createdAt updatedAt').lean(),
    Course.countDocuments(filter)
  ]);

  const data = items.map(c => ({
    _id: c._id,
    title: c.title,
    description: c.description || '',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    enrollmentStatus: pending.has(String(c._id)) ? 'pending' : 'none'
  }));

  return { data, meta: { total, page: p, limit: l } };
}

module.exports = {
  listCoursesForUser,
  createCourse,
  getCourseDetails,
  getStudentsOfCourse,
  updateCourse,
  deleteCourse,
  listCatalog
};
