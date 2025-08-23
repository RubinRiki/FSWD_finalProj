// services/submissionService.js
const mongoose   = require('mongoose');
const fs         = require('fs');
const path       = require('path');

const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course     = require('../models/Course');

const { SUBMISSIONS_DIR, PUBLIC_BASE } = require('../config/storage');

const toOid = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);

function parseSort(s = '-submittedAt') {
  const out = {};
  String(s || '').split(',').forEach(tok => {
    tok = tok.trim(); if (!tok) return;
    const dir = tok.startsWith('-') ? -1 : 1;
    const key = tok.replace(/^-/, '');
    if (key) out[key] = dir;
  });
  return Object.keys(out).length ? out : { submittedAt: -1 };
}

// Build public URL for a stored key
const publicUrlFor = (key) => {
  if (!key) return '';
  const base = String(PUBLIC_BASE || '').replace(/\/+$/, '');
  return base ? `${base}/uploads/submissions/${key}` : `/uploads/submissions/${key}`;
};


// Robust filename extraction from URL (cross-platform)
function nameFromUrl(u) {
  try {
    const p = new URL(String(u)).pathname;
    return decodeURIComponent(p.split('/').pop() || '');
  } catch {
    const s = String(u || '');
    const i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(i + 1) : s;
  }
}

// Ensure teacher owns the course of the assignment
async function ensureTeacherOwnsAssignment(teacherId, assignmentId) {
  const asg = await Assignment.findById(toOid(assignmentId)).select('courseId').lean();
  if (!asg) throw Object.assign(new Error('Assignment not found'), { status: 404 });
  const crs = await Course.findById(asg.courseId).select('createdBy').lean();
  if (!crs || String(crs.createdBy) !== String(teacherId)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return asg;
}

/**
 * List submissions for a single assignment, scoped by role.
 * Teacher (owner) -> all, Student -> only his own.
 */
async function listSubmissionsForAssignment({ assignment, sort = '-submittedAt', page = 1, limit = 50, requester }) {
  if (!assignment) throw new Error('assignment is required');
  const assignmentId = toOid(assignment);
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  const role   = requester?.role;
  const userId = String(requester?.userId || '');

  const match = { assignmentId };
  if (role === 'teacher') {
    await ensureTeacherOwnsAssignment(userId, assignmentId);
  } else if (role === 'student') {
    match.studentId = toOid(userId);
  } else {
    const err = new Error('Forbidden'); err.status = 403; throw err;
  }

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
          fileUrl: 1,
          fileName: 1,
          fileKey: 1,
          student: { _id: '$student._id', name: '$student.name', email: '$student.email' }
      } }
    ]),
    Submission.countDocuments(match)
  ]);

  // Backfill for legacy rows
  const normalized = items.map(r => {
    const url = r.fileUrl || publicUrlFor(r.fileKey || '');
    const name = r.fileName || (url ? nameFromUrl(url) : 'SUBMISSION');
    return { ...r, fileUrl: url, fileName: name };
  });

  return { items: normalized, total, page: p, limit: l };
}

/**
 * Bulk grade update (teacher only). Ownership enforced here.
 */
async function bulkUpdateSubmissions({ assignment, updates = [], requester }) {
  if (!assignment) throw new Error('assignment is required');
  if (!Array.isArray(updates) || updates.length === 0) return { updated: 0 };

  await ensureTeacherOwnsAssignment(requester?.userId, assignment);

  const ops = [];
  for (const u of updates) {
    if (!u || !u._id) continue;
    const $set = {};
    if (Object.prototype.hasOwnProperty.call(u, 'grade')) $set.grade = u.grade === null ? null : Number(u.grade);
    if (Object.prototype.hasOwnProperty.call(u, 'note'))  $set.note  = String(u.note || '');
    if (!Object.keys($set).length) continue;
    ops.push({
      updateOne: {
        filter: { _id: toOid(u._id), assignmentId: toOid(assignment) },
        update: { $set }
      }
    });
  }
  if (!ops.length) return { updated: 0 };
  const res = await Submission.bulkWrite(ops, { ordered: false });
  return { updated: (res.modifiedCount || 0) + (res.upsertedCount || 0) };
}

/**
 * Save uploaded submission (student). Creates a new row for each upload.
 */
async function saveSubmissionFromUpload({ studentId, assignmentId, savedFilename, originalName, note = '' }) {
  const asg = await Assignment.findById(toOid(assignmentId)).select('_id').lean();
  if (!asg) { const e = new Error('Assignment not found'); e.status = 404; throw e; }

  const payload = {
    assignmentId: toOid(assignmentId),
    studentId: toOid(studentId),
    submittedAt: new Date(),
    note: String(note || ''),
    fileKey: savedFilename,
    fileUrl: publicUrlFor(savedFilename),
    fileName: (originalName || savedFilename || 'SUBMISSION')
  };

  const doc = await Submission.create(payload);

  return {
    _id: doc._id,
    assignmentId: doc.assignmentId,
    studentId: doc.studentId,
    submittedAt: doc.submittedAt,
    grade: doc.grade,
    note: doc.note,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName
  };
}

/**
 * Get absolute file path for serving (owner student or teacher-owner).
 */
async function getSubmissionFilePath({ submissionId, requester }) {
  const sub = await Submission.findById(toOid(submissionId)).select('studentId assignmentId fileKey fileUrl fileName').lean();
  if (!sub) { const e = new Error('Not found'); e.status = 404; throw e; }

  const userId = String(requester?.userId || '');
  const role   = requester?.role;

  if (role === 'student') {
    if (String(sub.studentId) !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  } else if (role === 'teacher') {
    await ensureTeacherOwnsAssignment(userId, sub.assignmentId);
  } else {
    const e = new Error('Forbidden'); e.status = 403; throw e;
  }

  const key = sub.fileKey || nameFromUrl(sub.fileUrl || '');
  const absPath = path.join(SUBMISSIONS_DIR, key);
  if (!key || !fs.existsSync(absPath)) { const e = new Error('File not found'); e.status = 404; throw e; }

  const downloadName = sub.fileName || nameFromUrl(sub.fileUrl || key) || 'submission';
  return { absPath, downloadName };
}

/**
 * Delete a submission (owner student or teacher-owner). Also deletes file.
 */
async function deleteSubmission({ id, requester }) {
  const sub = await Submission.findById(toOid(id)).select('studentId assignmentId fileKey fileUrl').lean();
  if (!sub) { const e = new Error('Not found'); e.status = 404; throw e; }

  const userId = String(requester?.userId || '');
  const role = requester?.role;
  if (role !== 'student' || String(sub.studentId) !== userId) { const e = new Error('Forbidden'); e.status = 403; throw e; }

  const asg = await Assignment.findById(sub.assignmentId).select('dueDate').lean();
  const now = new Date();
  if (asg?.dueDate && now > asg.dueDate) { const e = new Error('Deadline passed'); e.status = 409; throw e; }

  await Submission.deleteOne({ _id: sub._id });

  const key = sub.fileKey || nameFromUrl(sub.fileUrl || '');
  if (key) {
    const fp = path.join(SUBMISSIONS_DIR, key);
    try { await fs.promises.unlink(fp); } catch (_) {}
  }
  return true;
}

/**
 * Aggregate counts per assignment (used by assignmentService).
 */
async function countSubmissionsByAssignment(assignmentIds = []) {
  const ids = (assignmentIds || []).filter(Boolean).map(toOid);
  if (!ids.length) return {};
  const rows = await Submission.aggregate([
    { $match: { assignmentId: { $in: ids } } },
    { $group: { _id: '$assignmentId', count: { $sum: 1 } } }
  ]);
  const map = {};
  for (const r of rows) map[String(r._id)] = r.count;
  return map;
}

module.exports = {
  listSubmissionsForAssignment,
  bulkUpdateSubmissions,
  saveSubmissionFromUpload,
  getSubmissionFilePath,
  deleteSubmission,                 
  countSubmissionsByAssignment
};
