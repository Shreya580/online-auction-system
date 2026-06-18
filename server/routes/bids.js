const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Item = require('../models/Item');
const { protect } = require('../middleware/authMiddleware');

// POST /api/bids — place a bid
router.post('/', protect, async (req, res) => {
  try {
    const { itemId, amount } = req.body;

    // 1. Find the item
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // 2. Check auction is still active
    if (!item.isActive) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // 3. Check auction hasn't expired
    if (new Date() > new Date(item.endTime)) {
      item.isActive = false;
      await item.save();
      return res.status(400).json({ message: 'Auction has expired' });
    }

    // 4. Check bid is higher than current
    if (amount <= item.currentBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current bid of ${item.currentBid}` 
      });
    }

    // 5. Check seller isn't bidding on their own item
    if (item.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own item' });
    }

    // 6. Save the bid
    const bid = await Bid.create({
      item: itemId,
      bidder: req.user._id,
      amount,
      isAutoBid: false
    });

    // 7. Update the item's current bid and winner
    item.currentBid = amount;
    item.currentWinner = req.user._id;
    await item.save();

    // 8. Check for auto-bid challengers
    await processAutoBids(itemId, amount, req.user._id, req.app.get('io'));

    // 9. Emit real-time event to everyone viewing this item
    const io = req.app.get('io');
    io.to(itemId).emit('bid_placed', {
      itemId,
      amount,
      bidder: {
        _id: req.user._id,
        name: req.user.name
      },
      timestamp: bid.createdAt
    });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/bids/:itemId — get bid history for an item
router.get('/:itemId', async (req, res) => {
  try {
    const bids = await Bid.find({ item: req.params.itemId })
      .populate('bidder', 'name')
      .sort({ amount: -1 });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-bid processor
async function processAutoBids(itemId, newBidAmount, lastBidderId, io) {
  const AutoBid = require('../models/AutoBid');
  
  // Find all active auto-bids for this item except the person who just bid
  const autoBids = await AutoBid.find({
    item: itemId,
    isActive: true,
    user: { $ne: lastBidderId },
    maxBudget: { $gt: newBidAmount }
  }).sort({ createdAt: 1 }); // oldest first = fairness

  if (autoBids.length === 0) return;

  // Take the first eligible auto-bidder
  const autoBid = autoBids[0];
  const incrementAmount = newBidAmount + 50; // bid 50 above current

  if (incrementAmount > autoBid.maxBudget) return;

  // Place the auto bid
  const bid = await Bid.create({
    item: itemId,
    bidder: autoBid.user,
    amount: incrementAmount,
    isAutoBid: true
  });

  // Update item
  const item = await require('../models/Item').findById(itemId);
  item.currentBid = incrementAmount;
  item.currentWinner = autoBid.user;
  await item.save();

  // Emit real-time event
  io.to(itemId).emit('bid_placed', {
    itemId,
    amount: incrementAmount,
    bidder: { _id: autoBid.user, name: 'Auto-bid' },
    isAutoBid: true,
    timestamp: bid.createdAt
  });
}

// POST /api/bids/autobid — set auto-bid
router.post('/autobid', protect, async (req, res) => {
  try {
    const AutoBid = require('../models/AutoBid');
    const { itemId, maxBudget } = req.body;

    // Check item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // maxBudget must be higher than current bid
    if (maxBudget <= item.currentBid) {
      return res.status(400).json({ 
        message: `Max budget must be higher than current bid of ${item.currentBid}` 
      });
    }

    // Upsert — update if exists, create if not
    const autoBid = await AutoBid.findOneAndUpdate(
      { user: req.user._id, item: itemId },
      { maxBudget, isActive: true },
      { upsert: true, new: true }
    );

    res.status(201).json(autoBid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/bids/autobid/:itemId — cancel auto-bid
router.delete('/autobid/:itemId', protect, async (req, res) => {
  try {
    const AutoBid = require('../models/AutoBid');
    await AutoBid.findOneAndUpdate(
      { user: req.user._id, item: req.params.itemId },
      { isActive: false }
    );
    res.json({ message: 'Auto-bid cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/bids/my — get all bids placed by the logged-in user
router.get('/my', protect, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate({
        path: 'item',
        select: 'title category condition currentBid currentWinner isActive endTime',
        populate: { path: 'currentWinner', select: 'name _id' }
      })
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;