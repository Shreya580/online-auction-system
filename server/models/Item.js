const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair'],
    required: true
  },
  startingPrice: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  currentWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
