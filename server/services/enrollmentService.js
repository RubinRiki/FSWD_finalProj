 
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');

const toOid = v => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

function parseSort(s = '-createdAt') {
  const out = {};
  String(s).split(',').forEach(tok => {
    const key = tok.replace(/^-/, '');
    const dir = tok.startsWith('-') ? -1 : 1;
    if (key) out[key] = dir;
  });
  return out;
}

async function listEnrollmentsForCourse({ course, sort = '-createdAt', page = 1, limit = 50 }) {
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
      { $project: { _id: 1, createdAt: 1, student: { id: '$student._id', name: '$student.name', email: '$student.email' } } }
    ]),
    Enrollment.countDocuments(match)
  ]);
  return { items, total, page: p, limit: l };
}

module.exports = { listEnrollmentsForCourse };
