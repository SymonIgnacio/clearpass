const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Database connection pool
let db;
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Initialize database pool (call this after dotenv config)
async function initializeDatabasePool() {
  db = await mysql.createPool(dbConfig);
}

// Store connected clients
const clients = new Map();

// WebSocket server instance
let wss = null;

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
async function initializeWebSocket(server) {
  // Initialize database pool first
  await initializeDatabasePool();

  wss = new WebSocket.Server({
    server,
    path: '/ws/notifications',
    perMessageDeflate: false
  });

  wss.on('connection', (ws, request) => {
    console.log('New WebSocket connection established');

    // Extract token from query parameters or headers
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token') ||
                  request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.isAlive = true;

      // Store client connection
      if (!clients.has(decoded.id)) {
        clients.set(decoded.id, new Set());
      }
      clients.get(decoded.id).add(ws);

      console.log(`User ${decoded.id} (${decoded.role}) connected via WebSocket`);

      // Send welcome message
      sendToUser(decoded.id, {
        type: 'connection',
        title: 'Connected',
        message: 'Successfully connected to notification service',
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket connection closed for user ${ws.userId}`);
        if (clients.has(ws.userId)) {
          clients.get(ws.userId).delete(ws);
          if (clients.get(ws.userId).size === 0) {
            clients.delete(ws.userId);
          }
        }
      });

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Invalid authentication token');
    }
  });

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log('Terminating dead WebSocket connection');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  console.log('WebSocket server initialized on path /ws/notifications');
}

/**
 * Handle incoming WebSocket messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message object
 */
function handleMessage(ws, message) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'mark_read':
      // Handle marking notifications as read
      if (message.notificationId) {
        // This would typically update the database
        console.log(`User ${ws.userId} marked notification ${message.notificationId} as read`);
      }
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

/**
 * Send notification to specific user
 * @param {number} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 */
function sendToUser(userId, notification) {
  const userClients = clients.get(userId);
  if (userClients && userClients.size > 0) {
    const message = JSON.stringify(notification);
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    return true;
  }
  return false;
}

/**
 * Send notification to multiple users
 * @param {Array<number>} userIds - Array of user IDs
 * @param {Object} notification - Notification object
 */
function sendToUsers(userIds, notification) {
  let sent = 0;
  userIds.forEach(userId => {
    if (sendToUser(userId, notification)) {
      sent++;
    }
  });
  return sent;
}

/**
 * Send notification to all users with specific role
 * @param {string} role - User role to target
 * @param {Object} notification - Notification object
 */
function sendToRole(role, notification) {
  let sent = 0;
  clients.forEach((userClients, userId) => {
    // Find user role from connected clients
    const client = Array.from(userClients)[0];
    if (client && client.userRole === role) {
      if (sendToUser(userId, notification)) {
        sent++;
      }
    }
  });
  return sent;
}

/**
 * Broadcast notification to all connected users
 * @param {Object} notification - Notification object
 */
function broadcast(notification) {
  let sent = 0;
  clients.forEach((userClients, userId) => {
    if (sendToUser(userId, notification)) {
      sent++;
    }
  });
  return sent;
}

/**
 * Create and send system notification
 * @param {Object} options - Notification options
 */
async function createSystemNotification(options) {
  const {
    title,
    message,
    type = 'info',
    priority = 'normal',
    targetUsers = null,
    targetRole = null,
    data = {}
  } = options;

  const notification = {
    id: Date.now(),
    type,
    title,
    message,
    priority,
    timestamp: new Date().toISOString(),
    data,
    system: true
  };

  let sent = 0;

  try {
    if (targetUsers) {
      // Send to specific users
      sent = sendToUsers(targetUsers, notification);
    } else if (targetRole) {
      // Send to all users with specific role
      sent = sendToRole(targetRole, notification);
    } else {
      // Broadcast to all users
      sent = broadcast(notification);
    }

    // Store notification in database for persistence
    await storeNotification(notification, targetUsers, targetRole);

    console.log(`System notification sent to ${sent} users: ${title}`);
    return { success: true, sent };

  } catch (error) {
    console.error('Error creating system notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Store notification in database for persistence
 * @param {Object} notification - Notification object
 * @param {Array<number>|null} targetUsers - Target user IDs
 * @param {string|null} targetRole - Target role
 */
async function storeNotification(notification, targetUsers, targetRole) {
  try {
    const connection = await db.getConnection();

    // Insert notification
    const [result] = await connection.execute(
      'INSERT INTO notifications (type, title, message, priority, data, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        JSON.stringify(notification.data),
        notification.timestamp
      ]
    );

    const notificationId = result.insertId;

    // Link notification to users
    if (targetUsers) {
      for (const userId of targetUsers) {
        await connection.execute(
          'INSERT INTO user_notifications (user_id, notification_id, is_read) VALUES (?, ?, ?)',
          [userId, notificationId, 0]
        );
      }
    } else if (targetRole) {
      // Get all users with the specified role
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE role = ? AND is_active = true',
        [targetRole]
      );

      for (const user of users) {
        await connection.execute(
          'INSERT INTO user_notifications (user_id, notification_id, is_read) VALUES (?, ?, ?)',
          [user.id, notificationId, 0]
        );
      }
    } else {
      // Send to all active users
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE is_active = true'
      );

      for (const user of users) {
        await connection.execute(
          'INSERT INTO user_notifications (user_id, notification_id, is_read) VALUES (?, ?, ?)',
          [user.id, notificationId, 0]
        );
      }
    }

    connection.release();
  } catch (error) {
    console.error('Error storing notification:', error);
    // Don't throw error - WebSocket notification was already sent
  }
}

/**
 * Get user notifications from database
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of notifications to return
 */
async function getUserNotifications(userId, limit = 50) {
  try {
    const connection = await db.getConnection();
    const [notifications] = await connection.execute(`
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.data,
        n.created_at,
        un.is_read
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      WHERE un.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ?
    `, [userId, limit]);

    connection.release();

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      timestamp: n.created_at,
      read: n.is_read === 1,
      data: JSON.parse(n.data || '{}')
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 */
async function markAsRead(userId, notificationId) {
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND notification_id = ?',
      [userId, notificationId]
    );
    connection.release();
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Get unread notification count for user
 * @param {number} userId - User ID
 */
async function getUnreadCount(userId) {
  try {
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    connection.release();
    return result[0].count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get connection statistics
 */
function getStats() {
  return {
    totalClients: wss ? wss.clients.size : 0,
    connectedUsers: clients.size,
    uptime: process.uptime()
  };
}

module.exports = {
  initializeWebSocket,
  sendToUser,
  sendToUsers,
  sendToRole,
  broadcast,
  createSystemNotification,
  getUserNotifications,
  markAsRead,
  getUnreadCount,
  getStats
};
