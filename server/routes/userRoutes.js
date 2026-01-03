const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT id, username, full_name, role FROM users LIMIT 50`);
      res.json({ users: rows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  return router;
};
