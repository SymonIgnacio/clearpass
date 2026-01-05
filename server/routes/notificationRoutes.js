const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (db) => {
  const router = express.Router();
  const notificationController = new NotificationController(db);

  // Get user notifications
  router.get('/', verifyToken, (req, res) => notificationController.getNotifications(req, res));

  // Get unread count
  router.get('/unread-count', verifyToken, (req, res) => notificationController.getUnreadCount(req, res));

  // Mark notification as read
  router.put('/:id/read', verifyToken, (req, res) => notificationController.markAsRead(req, res));

  // Mark all notifications as read
  router.put('/mark-all-read', verifyToken, (req, res) => notificationController.markAllAsRead(req, res));

  return router;
};