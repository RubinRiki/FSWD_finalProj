const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
  fileUrl:      { type: String, required: true, trim: true },
  submittedAt:  { type: Date, default: Date.now, index: true },
  grade:        { type: Number, min: 0, max: 100, default: null },
  note:         { type: String, default: '' }
});

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
