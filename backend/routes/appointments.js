const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// User books appointment with photo
router.post('/', auth, upload.single('photo'), async (req, res) => {
  const { date, time, hivespot, address, severity, latitude, longitude, fullName, email, phone } = req.body;
  console.log('Booking appointment:', req.body); // Debug log
  console.log('userId:', req.user.userId); // Debug log
  try {
    // Check if user exists
    const userExists = await User.findById(req.user.userId);
    if (!userExists) {
      return res.status(400).json({ error: 'User not found. Please login again.' });
    }
    const appointment = new Appointment({
      user: req.user.userId,
      fullName,
      email,
      phone,
      date,
      time,
      hivespot,
      address,
      severity,
      photo: req.file ? req.file.filename : '',
      latitude,
      longitude,
      statusHistory: [{ status: 'pending', updatedAt: new Date() }],
      status: 'pending',
      serviceCharge: 500
    });
    await appointment.save();
    res.json({ message: 'Your booking is taken under process!' });
  } catch (err) {
    console.error('Appointment save error:', err); // Debug log
    res.status(400).json({ error: err.message });
  }
});

// Get appointments based on user role
router.get('/', auth, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'beekeeper') {
      // If beekeeper, find appointments assigned to them
      appointments = await Appointment.find({ beekeeper: req.user.userId })
        .populate('user', 'name email phone')
        .populate('beekeeper', 'name') // Also populate beekeeper info
        .sort({ date: -1 });
    } else {
      // If regular user, find appointments they created
      appointments = await Appointment.find({ user: req.user.userId }).sort({ date: -1 });
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// User cancels an appointment (changed from DELETE to PATCH)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    // --- DIAGNOSTIC LOGGING (Moved to correct route) ---
    console.log('--- Appointment Cancellation Check ---');
    console.log('Appointment Owner ID:', appointment.user ? appointment.user.toString() : 'Not Found');
    console.log('Requesting User ID:  ', req.user ? req.user.userId : 'Not Found');
    if (req.user && appointment.user) {
      console.log('IDs Match:', appointment.user.toString() === req.user.userId);
    }
    // ----------------------------------------------------
    if (!appointment.user || appointment.user.toString() !== req.user.userId) {
      return res.status(401).json({ error: 'User not authorized' });
    }
    // Optional: Add logic to prevent cancellation if the appointment is already 'completed'
    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending appointments can be cancelled.' });
    }

    appointment.status = 'cancelled';
    appointment.statusHistory.push({ status: 'cancelled', updatedAt: new Date() });
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User submits a review for an appointment
router.post('/:id/review', auth, async (req, res) => {
  const { rating, review } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.user.toString() !== req.user.userId) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    appointment.rating = rating;
    appointment.review = review;
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Beekeeper updates an appointment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    // CRITICAL FIX: Populate the 'beekeeper' field to use it in the security check.
    const appointment = await Appointment.findById(req.params.id).populate('beekeeper');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Security check: only the assigned beekeeper or an admin can update the status.
    if (req.user.role !== 'admin' && (!appointment.beekeeper || appointment.beekeeper._id.toString() !== req.user.userId)) {
      return res.status(403).json({ error: 'You are not authorized to update this appointment.' });
    }

    appointment.status = status;
    appointment.statusHistory.push({ status: status, updatedAt: new Date() });
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    console.error('Beekeeper update status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;