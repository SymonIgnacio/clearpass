const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/', verifyToken, async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT c.* FROM certificates_log c ORDER BY c.created_at DESC LIMIT 50`);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  });

  return router;
};
