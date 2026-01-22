// const logger = require('../middleware/logger');

class NotificationController {
  constructor(db) {
    this.db = db;
  }

  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      let query = `
        SELECT n.id, n.title, n.message, n.type, n.priority, n.data, 
               un.is_read, un.read_at, n.created_at
        FROM notifications n
        INNER JOIN user_notifications un ON n.id = un.notification_id
        WHERE un.user_id = ?
      `;
      const params = [userId];

      if (unread_only === 'true') {
        query += ' AND un.is_read = 0';
      }

      query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [notifications] = await this.db.execute(query, params);

      const [countResult] = await this.db.execute(
        `SELECT COUNT(*) as total FROM user_notifications WHERE user_id = ?${unread_only === 'true' ? ' AND is_read = 0' : ''}`,
        [userId]
      );

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.db.execute(
        'UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE notification_id = ? AND user_id = ?',
        [id, userId]
      );

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await this.db.execute(
        'UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const [result] = await this.db.execute(
        'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      res.json({ success: true, count: result[0].count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ success: false, message: 'Failed to get unread count' });
    }
  }

  async createNotification(
    userId,
    title,
    message,
    type = 'info',
    priority = 'normal',
    data = null
  ) {
    try {
      // Insert notification
      const [notificationResult] = await this.db.execute(
        'INSERT INTO notifications (title, message, type, priority, data) VALUES (?, ?, ?, ?, ?)',
        [title, message, type, priority, JSON.stringify(data)]
      );

      const notificationId = notificationResult.insertId;

      // Create user notification link
      await this.db.execute(
        'INSERT INTO user_notifications (user_id, notification_id) VALUES (?, ?)',
        [userId, notificationId]
      );

      const notification = {
        id: notificationId,
        title,
        message,
        type,
        priority,
        data,
        is_read: false,
        created_at: new Date(),
      };

      // Emit to WebSocket if available
      if (global.wsService) {
        global.wsService.sendToUser(userId, {
          type: 'notification',
          data: notification,
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for multiple users
  async createBulkNotification(
    userIds,
    title,
    message,
    type = 'info',
    priority = 'normal',
    data = null
  ) {
    try {
      // Insert notification
      const [notificationResult] = await this.db.execute(
        'INSERT INTO notifications (title, message, type, priority, data) VALUES (?, ?, ?, ?, ?)',
        [title, message, type, priority, JSON.stringify(data)]
      );

      const notificationId = notificationResult.insertId;

      // Create user notification links for all users
      const userNotificationValues = userIds.map(userId => [userId, notificationId]);
      const placeholders = userNotificationValues.map(() => '(?, ?)').join(', ');
      const flatValues = userNotificationValues.flat();

      await this.db.execute(
        `INSERT INTO user_notifications (user_id, notification_id) VALUES ${placeholders}`,
        flatValues
      );

      const notification = {
        id: notificationId,
        title,
        message,
        type,
        priority,
        data,
        is_read: false,
        created_at: new Date(),
      };

      // Emit to WebSocket for all users if available
      if (global.wsService) {
        userIds.forEach(userId => {
          global.wsService.sendToUser(userId, {
            type: 'notification',
            data: notification,
          });
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating bulk notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationController;
