const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  router.get('/', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`SELECT c.* FROM certificates_log c ORDER BY c.created_at DESC LIMIT 50`);
    res.json(rows);
  }));

  return router;
};
