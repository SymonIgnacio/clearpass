const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

module.exports = (db) => {
  // GET all users
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary']), asyncHandler(userController.getAll));
  
  // GET current user profile
  router.get('/me', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`
      SELECT id, username, full_name, role, email, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  }));

  return router;
};
