const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const toOid = v => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

function parseSort(s = '-_id') {
  const out = {};
  String(s).split(',').forEach(tok => {
    const key = tok.replace(/^-/, '');
    const dir = tok.startsWith('-') ? -1 : 1;
    if (key) out[key] = dir;
  });
  return out;
}

async function listEnrollmentsForCourse({ course, sort = '-_id', page = 1, limit = 50 }) {
  if (!course) throw new Error('course is required');
  const courseId = toOid(course);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const match = { courseId };
  const [items, total] = await Promise.all([
    Enrollment.aggregate([
      { $match: match },
      { $sort: parseSort(sort) },
      { $skip: (p - 1) * l },
      { $limit: l },
      { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, status: 1, student: { id: '$student._id', name: '$student.name', email: '$student.email' } } }
    ]),
    Enrollment.countDocuments(match)
  ]);
  return { items, total, page: p, limit: l };
}

async function enrollNow({ courseId, studentId }) {
  const cId = toOid(courseId);
  const sId = toOid(studentId);
  const course = await Course.findById(cId).select('openEnrollment requireApproval').lean();
  if (!course) { const e = new Error('Course not found'); e.status = 404; throw e; }
  const existing = await Enrollment.findOne({ courseId: cId, studentId: sId });
  if (existing) return { id: existing._id, status: existing.status };
  const status = (course.openEnrollment && !course.requireApproval) ? 'approved' : 'pending';
  const doc = await Enrollment.create({ courseId: cId, studentId: sId, status });
  return { id: doc._id, status: doc.status };
}

async function requestEnroll({ courseId, studentId }) {
  const cId = toOid(courseId);
  const sId = toOid(studentId);
  const existing = await Enrollment.findOne({ courseId: cId, studentId: sId });
  if (existing) return { id: existing._id, status: existing.status };
  const doc = await Enrollment.create({ courseId: cId, studentId: sId, status: 'pending' });
  return { id: doc._id, status: doc.status };
}

async function leaveCourse({ courseId, studentId }) {
  const cId = toOid(courseId);
  const sId = toOid(studentId);
  await Enrollment.deleteOne({ courseId: cId, studentId: sId });
  return { ok: true };
}

async function listPendingRequestsForTeacher({ teacherId, sort = '-_id', page = 1, limit = 100 }) {
  const tId = toOid(teacherId);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const [items, total] = await Promise.all([
    Enrollment.aggregate([
      { $match: { status: 'pending' } },
      { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $match: { 'course.createdBy': tId } },
      { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $sort: parseSort(sort) },
      { $skip: (p - 1) * l },
      { $limit: l },
      { $project: { _id: 1, status: 1, course: { _id: '$course._id', title: '$course.title' }, student: { _id: '$student._id', name: '$student.name', email: '$student.email' } } }
    ]),
    Enrollment.countDocuments({ status: 'pending' })
  ]);
  return { items, total, page: p, limit: l };
}

async function approveEnrollment({ enrollmentId, teacherId }) {
  const eId = toOid(enrollmentId);
  const enr = await Enrollment.findById(eId).lean();
  if (!enr) { const e = new Error('Enrollment not found'); e.status = 404; throw e; }
  const course = await Course.findById(enr.courseId).select('createdBy').lean();
  if (!course || String(course.createdBy) !== String(teacherId)) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  await Enrollment.updateOne({ _id: eId }, { $set: { status: 'approved' } });
  return { ok: true };
}

async function rejectEnrollment({ enrollmentId, teacherId }) {
  const eId = toOid(enrollmentId);
  const enr = await Enrollment.findById(eId).lean();
  if (!enr) { const e = new Error('Enrollment not found'); e.status = 404; throw e; }
  const course = await Course.findById(enr.courseId).select('createdBy').lean();
  if (!course || String(course.createdBy) !== String(teacherId)) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  await Enrollment.updateOne({ _id: eId }, { $set: { status: 'rejected' } });
  return { ok: true };
}

module.exports = {
  listEnrollmentsForCourse,
  enrollNow,
  requestEnroll,
  leaveCourse,
  listPendingRequestsForTeacher,
  approveEnrollment,
  rejectEnrollment
};
