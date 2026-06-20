const express = require('express');
const router = express.Router();
const axios = require('axios');
const Item = require('../models/Item');
const { protect } = require('../middleware/authMiddleware');

// GET /api/items — get all active items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ isActive: true })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/items/my — get all items listed by the logged-in user
// MUST come before /:id or Express will think "my" is an :id
router.get('/my', protect, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user._id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/items/predict-price — AI price suggestion
// MUST come before /:id or Express will think "predict-price" is an :id
router.get('/predict-price', async (req, res) => {
  try {
    const { category, condition, age } = req.query;

    const { data } = await axios.post('http://localhost:8000/predict-price', {
      category,
      condition,
      age: Number(age)
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'ML service unavailable' });
  }
});

// GET /api/items/:id — get single item
// MUST come AFTER /my and /predict-price
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('currentWinner', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/items — create item (protected, sellers only)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, condition, startingPrice, endTime } = req.body;

    const item = await Item.create({
      title,
      description,
      category,
      condition,
      startingPrice,
      currentBid: startingPrice,
      seller: req.user._id,
      endTime: new Date(endTime),
      isActive: true
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/items/:id — delete item (only the seller who created it)
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
