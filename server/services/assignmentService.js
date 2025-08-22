const mongoose   = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course     = require('../models/Course');
const { countSubmissionsByAssignment } = require('./submissionService');

const toOid = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

function parseSort(s = '-createdAt') {
  const out = {};
  String(s || '').split(',').forEach(tok => {
    tok = tok.trim(); if (!tok) return;
    const dir = tok.startsWith('-') ? -1 : 1;
    const key = tok.replace(/^-/, '');
    if (key) out[key] = dir;
  });
  return Object.keys(out).length ? out : { createdAt: -1 };
}

function parseFields(fields) {
  if (!fields) return undefined;
  const list = String(fields).split(',').map(x => x.trim()).filter(Boolean);
  return list.length ? list.join(' ') : undefined;
}

// Ownership guards
async function ensureTeacherOwnsCourse(teacherId, courseId) {
  const c = await Course.findById(toOid(courseId)).select('createdBy').lean();
  if (!c) throw Object.assign(new Error('Course not found'), { status: 404 });
  if (String(c.createdBy) !== String(teacherId)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
}
async function ensureTeacherOwnsAssignment(teacherId, assignmentId) {
  const a = await Assignment.findById(toOid(assignmentId)).select('courseId').lean();
  if (!a) throw Object.assign(new Error('Not found'), { status: 404 });
  await ensureTeacherOwnsCourse(teacherId, a.courseId);
  return a;
}

// List by course
async function listAssignmentsForCourse({ course, sort = '-createdAt', page = 1, limit = 50, fields }) {
  if (!course) throw new Error('course is required');
  const courseId = toOid(course);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  const sel = parseFields(fields) || '_id title dueDate';
  const filter = { courseId };
  const [items, total] = await Promise.all([
    Assignment.find(filter).sort(parseSort(sort)).skip((p - 1) * l).limit(l).select(sel).lean(),
    Assignment.countDocuments(filter)
  ]);

  const counts = await countSubmissionsByAssignment(items.map(a => a._id));
  const enriched = items.map(a => ({
    ...a,
    submitted: counts[String(a._id)] || 0,
    stats: { submissions: counts[String(a._id)] || 0 }
  }));

  return { items: enriched, total, page: p, limit: l };
}

// Single item
async function getAssignmentById({ id, fields, include }) {
  const sel = parseFields(fields);
  const doc = await Assignment.findById(toOid(id)).select(sel).lean();
  if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });

  const inc = String(include || '');
  const needStats = inc.includes('stats');
  const result = { ...doc };

  if (inc.includes('course')) result.course = { _id: doc.courseId };
  if (needStats) {
    const map = await countSubmissionsByAssignment([doc._id]);
    result.stats = { submissions: map[String(doc._id)] || 0 };
  }
  return result;
}

// Create
async function createAssignment({ courseId, title, description = '', dueDate, requester }) {
  if (!courseId) throw Object.assign(new Error('courseId is required'), { status: 400 });
  if (!title)    throw Object.assign(new Error('title is required'),    { status: 400 });
  if (!dueDate)  throw Object.assign(new Error('dueDate is required'),  { status: 400 });
  if (!requester?.userId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  await ensureTeacherOwnsCourse(requester.userId, courseId);

  const payload = {
    courseId: toOid(courseId),
    title: String(title).trim(),
    description: String(description || ''),
    dueDate: new Date(dueDate)
  };
  const doc = await Assignment.create(payload);
  return doc.toObject();
}

// Update
async function updateAssignment({ id, payload = {}, requester }) {
  if (!requester?.userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  await ensureTeacherOwnsAssignment(requester.userId, id);

  const allowed = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'title'))       allowed.title = String(payload.title || '').trim();
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) allowed.description = String(payload.description || '');
  if (Object.prototype.hasOwnProperty.call(payload, 'dueDate'))     allowed.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;

  const doc = await Assignment.findByIdAndUpdate(toOid(id), { $set: allowed }, { new: true, runValidators: true }).lean();
  if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });
  return doc;
}

// Delete
async function deleteAssignment({ id, requester }) {
  if (!requester?.userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  await ensureTeacherOwnsAssignment(requester.userId, id);

  const _id = toOid(id);
  const hasSubs = await Submission.exists({ assignmentId: _id });
  if (hasSubs) throw Object.assign(new Error('Assignment has submissions'), { status: 409 });

  const res = await Assignment.deleteOne({ _id });
  if (!res.deletedCount) throw Object.assign(new Error('Not found'), { status: 404 });
  return true;
}

// Counts by course
async function countAssignmentsByCourseIds(courseIds = []) {
  if (!Array.isArray(courseIds) || courseIds.length === 0) return new Map();
  const ids = courseIds.map(toOid);
  const rows = await Assignment.aggregate([
    { $match: { courseId: { $in: ids } } },
    { $group: { _id: '$courseId', c: { $sum: 1 } } }
  ]);
  return new Map(rows.map(r => [String(r._id), r.c]));
}

module.exports = {
  listAssignmentsForCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  countAssignmentsByCourseIds
};
