const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 }, // Stock quantity
  beekeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user (beekeeper) who added the product
  image: { type: String } // Optional path to product image
});

module.exports = mongoose.model('Product', productSchema);