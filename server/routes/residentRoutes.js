const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK]), asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`SELECT r.* FROM residents r ORDER BY r.Last_Name LIMIT 50`);
    res.json({ data: rows });
  }));

  return router;
};
