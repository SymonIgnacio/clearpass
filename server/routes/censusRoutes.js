const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  router.get('/', verifyToken, checkRole([ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.ADMIN]), asyncHandler(async (req, res) => {
    const [stats] = await db.execute(`SELECT COUNT(*) as total FROM residents`);
    res.json({ overall: stats[0] });
  }));

  return router;
};
