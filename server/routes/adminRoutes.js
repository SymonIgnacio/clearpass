const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  router.get('/reports/users', verifyToken, checkRole([ROLES.ADMIN]), asyncHandler(async (req, res) => {
    const [userStats] = await db.execute(`SELECT COUNT(*) as total_users FROM users`);
    res.json({ user_statistics: userStats[0], generated_at: new Date().toISOString() });
  }));

  router.get('/reports/blotter', verifyToken, checkRole([ROLES.ADMIN]), asyncHandler(async (req, res) => {
    const [blotterStats] = await db.execute(`SELECT COUNT(*) as total_cases FROM blotter`);
    res.json({ blotter_statistics: blotterStats[0], generated_at: new Date().toISOString() });
  }));

  return router;
};
