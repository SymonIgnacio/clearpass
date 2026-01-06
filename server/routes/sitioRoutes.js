const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  // GET all sitios
  router.get('/', verifyToken, asyncHandler(async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT id, name, description
        FROM sitios
        ORDER BY name
      `);

      res.json(rows);
    } catch (error) {
      console.error('Error fetching sitios:', error);
      res.status(500).json({ error: 'Failed to fetch sitios' });
    }
  }));

  return router;
};