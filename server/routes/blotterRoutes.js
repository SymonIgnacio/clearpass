const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT b.* FROM blotter b ORDER BY b.created_at DESC LIMIT 50`);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blotter records' });
    }
  });

  return router;
};
