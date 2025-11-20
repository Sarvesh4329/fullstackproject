const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String },
  password: String,
  role: { type: String, enum: ['user', 'beekeeper', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true }, // All roles are approved by default now
  locality: { type: String, trim: true } // For beekeeper's area of service
});

module.exports = mongoose.model('User', userSchema);