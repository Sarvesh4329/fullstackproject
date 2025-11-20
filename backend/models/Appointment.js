const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  beekeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  hivespot: String,
  address: String,
  severity: String,
  photo: String, // Will store the filename or URL
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  statusHistory: [{
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
  }],
  serviceCharge: Number,
  latitude: { type: Number },
  longitude: { type: Number },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, trim: true }
});

module.exports = mongoose.model('Appointment', appointmentSchema);