const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, locality } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ name, email, phone, password: hashedPassword, role, locality });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.isBlocked) return res.status(403).json({ error: 'Your account has been blocked.' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid password' });
  const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey');
  res.json({ token, role: user.role });
});

// Get current user info
const { auth } = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  const user = await require('../models/User').findById(req.user.userId).select('-password'); // Corrected path
  res.json({ name: user.name, email: user.email, phone: user.phone });
});
module.exports = router;