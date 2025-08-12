const mongoose   = require('mongoose');
const Assignment = require('../models/Assignment'); // assumes { courseId: ObjectId, ... }

const toOid = (v) =>
  mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v;

/**
 * Counts how many assignments each course has (one DB query, grouped by courseId).
**/
async function countAssignmentsByCourseIds(courseIds = []) {
  if (!Array.isArray(courseIds) || courseIds.length === 0) return new Map();

  const ids = courseIds.map(toOid);

  const rows = await Assignment.aggregate([
    { $match: { courseId: { $in: ids } } },
    { $group: { _id: '$courseId', c: { $sum: 1 } } }
  ]);

  return new Map(rows.map(r => [String(r._id), r.c]));
}

module.exports = { countAssignmentsByCourseIds };
