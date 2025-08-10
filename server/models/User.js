const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role:  { type: String, enum: ['student', 'teacher'], required: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.passwordHash; return ret; }
});

module.exports = mongoose.model('User', userSchema);
