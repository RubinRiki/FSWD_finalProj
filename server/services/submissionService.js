const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const fs = require('fs');
const path = require('path');
const { SUBMISSIONS_DIR, PUBLIC_BASE } = require('../config/storage');


const toOid = v => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

function parseSort(s = '-submittedAt') {
  const out = {};
  String(s || '').split(',').forEach(tok => {
    if (!tok) return;
    const key = tok.replace(/^-/, '');
    const dir = tok.startsWith('-') ? -1 : 1;
    if (key) out[key] = dir;
  });
  return Object.keys(out).length ? out : { submittedAt: -1 };
}

async function listSubmissionsForAssignment({ assignment, sort = '-submittedAt', page = 1, limit = 50 }) {
  if (!assignment) throw new Error('assignment is required');
  const assignmentId = toOid(assignment);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const match = { assignmentId };
  const [items, total] = await Promise.all([
    Submission.aggregate([
      { $match: match },
      { $sort: parseSort(sort) },
      { $skip: (p - 1) * l },
      { $limit: l },
      { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: 1,
          assignmentId: 1,
          studentId: 1,
          submittedAt: 1,
          grade: 1,
          note: 1,
          student: { id: '$student._id', name: '$student.name', email: '$student.email' }
      } }
    ]),
    Submission.countDocuments(match)
  ]);
  return { items, total, page: p, limit: l };
}

async function bulkUpdateSubmissions({ assignment, updates = [] }) {
  if (!assignment) throw new Error('assignment is required');
  if (!Array.isArray(updates) || updates.length === 0) return { updated: 0 };
  const assignmentId = toOid(assignment);

  const ops = updates.map(u => {
    if (!u || !u._id) return null;
    const _id = toOid(u._id);
    const $set = {};
    if (Object.prototype.hasOwnProperty.call(u, 'grade')) $set.grade = u.grade;
    if (Object.prototype.hasOwnProperty.call(u, 'note'))  $set.note  = u.note ?? '';
    if (!Object.keys($set).length) return null;
    return { updateOne: { filter: { _id, assignmentId }, update: { $set } } };
  }).filter(Boolean);

  if (!ops.length) return { updated: 0 };

  const res = await Submission.bulkWrite(ops, { ordered: false });
  const updated = res.modifiedCount ?? res.nModified ?? 0;
  return { updated };
}

async function saveSubmissionFromUpload({ studentId, assignmentId, savedFilename, note = '' }) {
  const fileUrl = `${PUBLIC_BASE}/${savedFilename}`;
  const doc = await Submission.findOneAndUpdate(
    { assignmentId: toOid(assignmentId), studentId: toOid(studentId) },
    { fileUrl, submittedAt: new Date(), note },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return doc;
}

async function getSubmissionFilePath({ submissionId, requester }) {
  const sub = await Submission.findById(toOid(submissionId)).lean();
  if (!sub) throw Object.assign(new Error('Not found'), { status: 404 });
  const isTeacher = requester?.role === 'teacher';
  const isOwner = String(sub.studentId) === String(requester?._id || requester?.id);
  if (!isTeacher && !isOwner) throw Object.assign(new Error('Forbidden'), { status: 403 });
  const filename = path.basename(String(sub.fileUrl || ''));
  const absPath = path.join(SUBMISSIONS_DIR, filename);
  if (!fs.existsSync(absPath)) throw Object.assign(new Error('File not found'), { status: 404 });
  return { absPath, downloadName: filename };
}

module.exports = {
  listSubmissionsForAssignment,
  bulkUpdateSubmissions,
  saveSubmissionFromUpload,
  getSubmissionFilePath
};