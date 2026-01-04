const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  router.get('/', asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`SELECT b.* FROM blotter b ORDER BY b.created_at DESC LIMIT 50`);
    res.json(rows);
  }));

  return router;
};
