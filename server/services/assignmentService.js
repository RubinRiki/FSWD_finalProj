const mongoose   = require('mongoose');
const Assignment = require('../models/Assignment'); 
const {countSubmissionsByAssignment} = require ( '../services/submissionService');

const toOid = (v) =>
  mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v;

/**
 * Counts how many assignments each course has (one DB query, grouped by courseId).
**/
function parseSort(s = '-createdAt') {
  const out = {};
  String(s).split(',').forEach(tok => {
    const key = tok.replace(/^-/, '');
    const dir = tok.startsWith('-') ? -1 : 1;
    if (key) out[key] = dir;
  });
  return out;
}

async function listAssignmentsForCourse({ course, sort = '-createdAt', page = 1, limit = 50 }) {
  if (!course) throw new Error('course is required');
  const courseId = toOid(course);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const filter = { courseId };
  const [items, total] = await Promise.all([
    Assignment.find(filter).sort(parseSort(sort)).skip((p - 1) * l).limit(l).select('_id title dueDate').lean(),
    Assignment.countDocuments(filter),
  ]);
  return { items, total, page: p, limit: l };
}

async function countAssignmentsByCourseIds(courseIds = []) {
  if (!Array.isArray(courseIds) || courseIds.length === 0) return new Map();

  const ids = courseIds.map(toOid);

  const rows = await Assignment.aggregate([
    { $match: { courseId: { $in: ids } } },
    { $group: { _id: '$courseId', c: { $sum: 1 } } }
  ]);

  return new Map(rows.map(r => [String(r._id), r.c]));
}
async function listAssignmentsForCourse({ course, sort = '-createdAt', page = 1, limit = 50 }) {
  if (!course) throw new Error('course is required');
  const courseId = toOid(course);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const filter = { courseId };
  const [items, total] = await Promise.all([
    Assignment.find(filter).sort(parseSort(sort)).skip((p - 1) * l).limit(l).select('_id title dueDate').lean(),
    Assignment.countDocuments(filter),
  ]);

  const counts = await countSubmissionsByAssignment(items.map(a => a._id));
  const enriched = items.map(a => ({ ...a, submitted: counts[String(a._id)] || 0 }));
  console.log('Enriched assignments:', enriched);
  console.log("counts:", counts);

  return { items: enriched, total, page: p, limit: l };
}

module.exports = {
     countAssignmentsByCourseIds, 
     listAssignmentsForCourse
     };
