const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');

// User creates a new order
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid product ID or quantity.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock available.' });
    }

    const order = new Order({
      user: req.user.userId,
      beekeeper: product.beekeeper || product.user,
      product: productId,
      quantity,
      price: product.price,
      status: 'processing',
      statusHistory: [{ status: 'processing', updatedAt: new Date() }],
    });

    product.quantity -= quantity;

    await order.save();
    await product.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error during checkout.' });
  }
});
// User gets their own order history
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching orders.' });
  }
});

// Get all orders for products sold by the current beekeeper
router.get('/beekeeper', auth, requireRole('beekeeper'), async (req, res) => {
  try {
    // Find all products listed by the current beekeeper
    const beekeeperProducts = await Product.find({ user: req.user.userId }).select('_id');
    const productIds = beekeeperProducts.map(p => p._id);

    // Find all orders that contain those products
    const orders = await Order.find({ product: { $in: productIds } })
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching beekeeper orders.' });
  }
});

// Beekeeper updates an order status for their product
router.patch('/:id/status', auth, requireRole('beekeeper'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('product');

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Security Check: Ensure the logged-in beekeeper owns the product in the order
    if (!order.product || order.product.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to update this order.' });
    }

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });
    await order.save();

    res.json(order);
  } catch (err) {
    console.error('Beekeeper update order status error:', err);
    res.status(500).json({ error: 'Server error while updating order status.' });
  }
});

module.exports = router;