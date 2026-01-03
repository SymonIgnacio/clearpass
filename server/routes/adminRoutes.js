const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/reports/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const [userStats] = await db.execute(`SELECT COUNT(*) as total_users FROM users`);
      res.json({ user_statistics: userStats[0], generated_at: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate users report' });
    }
  });

  router.get('/reports/blotter', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const [blotterStats] = await db.execute(`SELECT COUNT(*) as total_cases FROM blotter`);
      res.json({ blotter_statistics: blotterStats[0], generated_at: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate blotter report' });
    }
  });

  return router;
};
