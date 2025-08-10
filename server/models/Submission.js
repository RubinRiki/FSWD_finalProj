const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl:      { type: String, required: true, trim: true },
  submittedAt:  { type: Date, default: Date.now },
  grade:        { type: Number, min: 0, max: 100, default: null }
});

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
