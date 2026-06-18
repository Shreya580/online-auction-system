const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  isAutoBid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);