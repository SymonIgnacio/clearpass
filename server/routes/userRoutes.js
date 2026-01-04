const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`SELECT id, username, full_name, role FROM users LIMIT 50`);
    res.json({ users: rows });
  }));

  return router;
};
