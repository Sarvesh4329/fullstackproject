const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// @route   GET /api/products (This route was missing)
// @desc    Get all products for any logged-in user to view
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const products = await Product.find({ quantity: { $gt: 0 } }).populate('beekeeper', 'name');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching products.' });
    }
});

// @route   GET /api/products/my-products
// @desc    Get all products for the logged-in beekeeper
// @access  Private (Beekeeper only)
router.get('/my-products', auth, requireRole('beekeeper'), async (req, res) => {
  try {
    const products = await Product.find({ beekeeper: req.user.userId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching beekeeper products.' });
  }
});

// @route   POST /api/products
// @desc    Beekeeper adds a new product
// @access  Private (Beekeeper only)
router.post('/', auth, requireRole('beekeeper'), upload.single('image'), async (req, res) => {
  const { name, description, price, quantity } = req.body;
  try {
    const newProduct = new Product({
      beekeeper: req.user.userId,
      name,
      description,
      price,
      quantity,
      image: req.file ? req.file.filename : ''
    });
    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error while adding product.' });
  }
});

// @route   PUT /api/products/:id
// @desc    Beekeeper updates a product
// @access  Private (Beekeeper only)
// NOTE: The logic for PUT and DELETE would go here as well.
// Add PUT (update) and DELETE (remove) routes so front-end admin/owner actions work.

// @route   PUT /api/products/:id
// @desc    Beekeeper updates a product
// @access  Private (Beekeeper only)
router.put('/:id', auth, requireRole('beekeeper'), upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    // only the beekeeper who created the product may update it
    if (product.beekeeper && product.beekeeper.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const { name, description, price, quantity } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (req.file) product.image = req.file.filename;

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating product.' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (beekeeper owner or admin)
// @access  Private (Beekeeper owner or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Allow admin to delete any product
    if (req.user.role === 'admin') {
      await product.remove();
      return res.json({ message: 'Product deleted by admin' });
    }

    // Otherwise only the beekeeper who added it can delete
    if (product.beekeeper && product.beekeeper.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    await product.remove();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting product.' });
  }
});

module.exports = router;