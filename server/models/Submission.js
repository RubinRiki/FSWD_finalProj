// models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
  submittedAt:  { type: Date, default: Date.now, index: true },
  grade:        { type: Number, default: null },
  note:         { type: String, default: '' },

  // file metadata for UI
  fileKey:      { type: String, default: '' },   // stored filename
  fileUrl:      { type: String, default: '' },   // public URL (/uploads/...)
  fileName:     { type: String, default: '' }    // display/original name
}, { timestamps: true });

submissionSchema.index({ assignmentId: 1, studentId: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
