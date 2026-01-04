const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  // GET user's notifications
  router.get('/my', verifyToken, asyncHandler(async (req, res) => {
    const [notifications] = await db.execute(`
      SELECT n.*, un.is_read, un.read_at
      FROM user_notifications un
      JOIN notifications n ON un.notification_id = n.id
      WHERE un.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    
    res.json({ notifications });
  }));
  
  // GET unread count
  router.get('/unread-count', verifyToken, asyncHandler(async (req, res) => {
    const [result] = await db.execute(`
      SELECT COUNT(*) as count
      FROM user_notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);
    
    res.json({ unread_count: result[0].count });
  }));
  
  // PUT mark as read
  router.put('/:id/read', verifyToken, asyncHandler(async (req, res) => {
    await db.execute(`
      UPDATE user_notifications
      SET is_read = TRUE, read_at = NOW()
      WHERE user_id = ? AND notification_id = ?
    `, [req.user.id, req.params.id]);
    
    res.json({ message: 'Notification marked as read' });
  }));
  
  // PUT mark all as read
  router.put('/read-all', verifyToken, asyncHandler(async (req, res) => {
    await db.execute(`
      UPDATE user_notifications
      SET is_read = TRUE, read_at = NOW()
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);
    
    res.json({ message: 'All notifications marked as read' });
  }));

  return router;
};
