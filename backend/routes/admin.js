const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const { auth, requireRole } = require('../middleware/auth'); // Assuming requireRole is defined in your auth middleware

// Get all users
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Update a user's role
router.patch('/users/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Block/Unblock a user
router.patch('/users/:id/block', auth, requireRole('admin'), async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a beekeeper
router.patch('/users/:id/approve', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a user
router.delete('/users/:id', auth, requireRole('admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// Get all appointments
router.get('/appointments', auth, requireRole('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('user', 'name').populate('beekeeper', 'name');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', auth, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name').populate('product', 'name');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin)
router.patch('/orders/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const allowed = ['processing', 'shipped', 'completed', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status, updatedAt: new Date() });
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('product', 'name')
      .populate('beekeeper', 'name');

    res.json(populated);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Server error while updating order status' });
  }
});

// Get all products
router.get('/products', auth, requireRole('admin'), async (req, res) => {
  try {
    const products = await Product.find().populate('user', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DANGER: Route to delete all appointments. For temporary use.
router.delete('/appointments/all', auth, requireRole('admin'), async (req, res) => {
  try {
    await Appointment.deleteMany({});
    res.json({ message: 'All appointments have been successfully deleted.' });
  } catch (err) {
    console.error('Error deleting all appointments:', err);
    res.status(500).json({ error: 'Server error while deleting appointments.' });
  }
});

// DANGER: Route to delete all orders. For temporary use.
router.delete('/orders/all', auth, requireRole('admin'), async (req, res) => {
  try {
    await Order.deleteMany({});
    res.json({ message: 'All orders have been successfully deleted.' });
  } catch (err) {
    console.error('Error deleting all orders:', err);
    res.status(500).json({ error: 'Server error while deleting orders.' });
  }
});

// Assign a beekeeper to an appointment
router.patch('/appointments/:id/assign', auth, requireRole('admin'), async (req, res) => {
  try {
    const { beekeeperId } = req.body;
    const appointmentExists = await Appointment.findById(req.params.id);
    if (!appointmentExists) return res.status(404).json({ error: 'Appointment not found' });

    // Use $push to add to the statusHistory array atomically
    await Appointment.updateOne(
      { _id: req.params.id },
      { 
        $set: { beekeeper: beekeeperId, status: 'accepted' },
        $push: { statusHistory: { status: 'accepted', updatedAt: new Date() } }
      }
    );

    // Re-fetch the appointment with populated fields to return to the client
    const populatedAppointment = await Appointment.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('beekeeper', 'name');
    res.json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// ----------------------------
// Reporting / Analytics Routes
// ----------------------------

// Orders report: total orders, revenue, counts per status, monthly orders (last 12 months)
router.get('/reports/orders', auth, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

    // Total orders and total revenue
    const totals = await Order.aggregate([
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } } } }
    ]);

    // Count by status
    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly orders for last 12 months
    const monthly = await Order.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      { $project: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } } },
      { $group: { _id: { year: '$year', month: '$month' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ totals: totals[0] || { totalOrders: 0, totalRevenue: 0 }, byStatus, monthly });
  } catch (err) {
    console.error('Error generating orders report:', err);
    res.status(500).json({ error: 'Server error generating orders report' });
  }
});

// Appointments report: total appointments, counts per status, per-beekeeper counts
router.get('/reports/appointments', auth, requireRole('admin'), async (req, res) => {
  try {
    // totals
    const totals = await Appointment.aggregate([
      { $group: { _id: null, totalAppointments: { $sum: 1 } } }
    ]);

    // count by status
    const byStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // appointments per beekeeper (top 10)
    const perBeekeeper = await Appointment.aggregate([
      { $match: { beekeeper: { $ne: null } } },
      { $group: { _id: '$beekeeper', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'beekeeperInfo' } },
      { $unwind: { path: '$beekeeperInfo', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, beekeeperId: '$_id', beekeeperName: '$beekeeperInfo.name', count: 1 } }
    ]);

    res.json({ totals: totals[0] || { totalAppointments: 0 }, byStatus, perBeekeeper });
  } catch (err) {
    console.error('Error generating appointments report:', err);
    res.status(500).json({ error: 'Server error generating appointments report' });
  }
});