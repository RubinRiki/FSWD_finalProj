const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt:   { type: Date, default: Date.now }
});

courseSchema.index({ createdBy: 1, createdAt: -1 });

courseSchema.index({ title: 'text', description: 'text' }, { weights: { title: 5, description: 1 } });

module.exports = mongoose.model('Course', courseSchema);
