const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data asynchronously
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// GET /api/items
// Supports server-side search (q) and pagination via `page` and `limit` query params.
// Response format: { total, page, limit, totalPages, items }
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { q } = req.query;
    // parse pagination params, provide sensible defaults
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);

    let results = data;

    if (q) {
      // Simple case-insensitive substring search on name
      const term = q.toLowerCase();
      results = results.filter(item => item.name.toLowerCase().includes(term));
    }

    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // ensure page is within range
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const paged = results.slice(start, start + limit);

    res.json({
      total,
      page: safePage,
      limit,
      totalPages,
      items: paged
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;