const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dueDate:     { type: Date, required: true }
}, { timestamps: true }); // createdAt/updatedAt

assignmentSchema.index({ courseId: 1, dueDate: -1 });
assignmentSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Assignment', assignmentSchema);
