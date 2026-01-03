const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT r.* FROM residents r ORDER BY r.Last_Name LIMIT 50`);
      res.json({ data: rows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch residents' });
    }
  });

  return router;
};
