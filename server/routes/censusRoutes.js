const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
    try {
      const [stats] = await db.execute(`SELECT COUNT(*) as total FROM residents`);
      res.json({ overall: stats[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch census data' });
    }
  });

  return router;
};
