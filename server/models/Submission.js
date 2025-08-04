 
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  courseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  fileUrl:      { type: String, required: true },
  submittedAt:  { type: Date, default: Date.now },
  grade:        { type: Number },
  feedback:     { type: String },
  gradedAt:     { type: Date }
});

module.exports = mongoose.model('Submission', submissionSchema);
