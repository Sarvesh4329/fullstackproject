const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  beekeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    // Added 'completed' to match frontend logic
    enum: ['processing', 'shipped', 'completed', 'delivered', 'cancelled'],
    default: 'processing'
  },
  createdAt: { type: Date, default: Date.now },
  statusHistory: [{
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Order', orderSchema);