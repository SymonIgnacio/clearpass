import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './useAuth';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

// Named export for the hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Named export for the provider
export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  });
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Client-side notification function
  const notify = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();
    
    // Safety Net: Poll every 30 seconds
    const pollInterval = setInterval(() => {
        console.log('Polling notifications...');
        fetchNotifications();
    }, 30000);

    // Initialize WebSocket connection
    // Use the API_URL to determine the WebSocket URL
    // If API_URL is http://localhost:3002/api, WS should be ws://localhost:3002/ws
    // If API_URL is https://example.com/api, WS should be wss://example.com/ws
    
    // Default fallback if API_URL isn't set
    let wsBaseUrl = 'ws://localhost:3002';
    
    if (typeof API_URL !== 'undefined') {
        try {
            const url = new URL(API_URL);
            const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            wsBaseUrl = `${protocol}//${url.host}`;
        } catch (e) {
            console.warn('Invalid API_URL for WebSocket, using fallback', e);
        }
    }
    
    const wsUrl = `${wsBaseUrl}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to notification service');
            // Authenticate
            const token = localStorage.getItem('token');
            if (token) {
                ws.send(JSON.stringify({ type: 'auth', token }));
            }
            // Fetch latest on connect/reconnect to ensure sync
            fetchNotifications();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'notification') {
                    // Add new notification to state
                    setNotifications(prev => [data.payload, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Show browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        new Notification(data.payload.title, {
                            body: data.payload.message,
                            icon: '/logo192.png'
                        });
                    }
                }
            } catch (error) {
                console.error('Error processing websocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from notification service, retrying in 5s...');
            reconnectTimeout = setTimeout(connect, 5000);
        };
        
        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            ws.close();
        };
    };

    connect();

    return () => {
      clearInterval(pollInterval);
      if (ws) {
          ws.onclose = null; // Prevent reconnect loop on unmount
          ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await apiRequest('/notifications');
      if (!response.ok) {
          // If 401/403, just clear notifications silently
          if (response.status === 401 || response.status === 403) {
              setNotifications([]);
              return;
          }
          throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.warn('Error fetching notifications (silenced):', error.message);
      // Do not throw, just log warning
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiRequest('/notifications/unread-count');
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiRequest('/notifications/mark-all-read', {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    notify // Expose the notify function
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
