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
// For this fix, we are focusing on the GET routes.

module.exports = router;