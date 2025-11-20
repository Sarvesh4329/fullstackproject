const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   GET /api/users/me
// @desc    Get current logged-in user's details
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Exclude password from the result
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/me
// @desc    Update current logged-in user's details
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { name, phone } },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating profile.' });
  }
});

// @route   GET /api/users/beekeepers/:locality
// @desc    Get all approved beekeepers in a specific locality
// @access  Private
router.get('/beekeepers/:locality', auth, async (req, res) => {
  try {
    const beekeepers = await User.find({
      role: 'beekeeper',
      isApproved: true,
      locality: { $regex: new RegExp(`^${req.params.locality}$`, 'i') } // Case-insensitive match
    }).select('name locality');
    res.json(beekeepers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;