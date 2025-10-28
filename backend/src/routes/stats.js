const express = require('express');
const path = require('path');
const router = express.Router();
const StatsManager = require('../utils/stats');

const DATA_PATH = path.join(__dirname, '../../../data/items.json');
const statsManager = new StatsManager(DATA_PATH);

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const stats = await statsManager.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;