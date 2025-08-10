const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title:      { type: String, required: true, trim: true },
  description:{ type: String, default: '' },
  dueDate:    { type: Date, required: true },
  createdAt:  { type: Date, default: Date.now }
});

assignmentSchema.index({ courseId: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
 
