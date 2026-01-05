const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
// const logger = require('../middleware/logger');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });
    
    this.clients = new Map(); // userId -> WebSocket
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth' && data.token) {
            this.authenticateClient(ws, data.token);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });

      // Send initial connection message
      ws.send(JSON.stringify({ 
        type: 'connection', 
        message: 'Connected to notification service' 
      }));
    });
  }

  authenticateClient(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      
      this.clients.set(decoded.id, ws);
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        message: 'Authentication successful' 
      }));
      
      console.info(`WebSocket client authenticated: User ${decoded.id}`);
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  removeClient(ws) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      console.info(`WebSocket client disconnected: User ${ws.userId}`);
    }
  }

  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  sendToRole(role, data) {
    let sent = 0;
    this.clients.forEach((client, userId) => {
      if (client.userRole === role && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
        sent++;
      }
    });
    return sent;
  }

  broadcast(data) {
    let sent = 0;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
        sent++;
      }
    });
    return sent;
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getConnectionCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketService;