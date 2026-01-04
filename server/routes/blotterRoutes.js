const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { fileOnline } = require('../blotterController');
const { authenticate } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/', asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`SELECT b.* FROM blotter b ORDER BY b.created_at DESC LIMIT 50`);
    res.json(rows);
  }));

  router.post('/file-online', authenticate, asyncHandler(fileOnline));

  return router;
};
