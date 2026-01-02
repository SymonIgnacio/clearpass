import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Fab
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Close,
  Event,
  Warning,
  Info,
  CheckCircle,
  Error,
  Sms,
  Announcement
} from '@mui/icons-material';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentSnackbar, setCurrentSnackbar] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // CRITICAL: Only connect if user is authenticated AND has token
    if (token && isAuthenticated) {
      initializeWebSocket();
    }
    loadPersistedNotifications();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [token, isAuthenticated]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const initializeWebSocket = () => {
    try {
      // CRITICAL: Only connect if user is authenticated AND has token
      if (!token || !isAuthenticated) {
        console.log('📡 User not authenticated, skipping WebSocket connection');
        return;
      }

      // Get authentication token
      const authToken = localStorage.getItem('authToken');
      console.log('📡 Initializing WebSocket with token:', authToken ? 'Token present' : 'No token');

      if (!authToken) {
        console.log('📡 No auth token found, skipping WebSocket connection');
        return;
      }

      const wsUrl = process.env.NODE_ENV === 'production'
        ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/ws/notifications?token=${encodeURIComponent(authToken)}`
        : `ws://localhost:3001/ws/notifications?token=${encodeURIComponent(authToken)}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('📡 WebSocket connected for notifications');
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('📡 Received notification:', notification);
          handleNewNotification(notification);
        } catch (error) {
          console.error('❌ Error parsing notification:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('📡 WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        setWsConnection(null);
        // Attempt to reconnect after 5 seconds
        setTimeout(initializeWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsConnection(null);
        // Fallback to polling
        startPolling();
      };

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      // Fallback to polling for notifications
      startPolling();
    }
  };

  const startPolling = () => {
    // Only poll if user has server-side authentication (staff users)
    // Residents use Firebase-only auth and don't need server notifications
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('📡 Skipping notification polling - user has Firebase-only auth (no server token)');
      return () => {}; // Return empty cleanup function
    }

    console.log('📡 Starting notification polling for authenticated staff user');

    // Fallback polling mechanism every 30 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/notifications/poll`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          data.forEach(notification => handleNewNotification(notification));
        } else if (response.status === 401) {
          console.error('❌ Notification polling failed: Unauthorized. Clearing invalid token.');
          localStorage.removeItem('authToken');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  };

  const loadPersistedNotifications = () => {
    const saved = localStorage.getItem('barangay_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading persisted notifications:', error);
      }
    }
  };

  const saveNotifications = (notifications) => {
    try {
      localStorage.setItem('barangay_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const handleNewNotification = (notification) => {
    const newNotification = {
      id: notification.id || Date.now(),
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      data: notification.data || {},
      priority: notification.priority || 'normal'
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated.slice(0, 100); // Keep only last 100 notifications
    });

    // Show snackbar for high priority notifications
    if (newNotification.priority === 'high') {
      showSnackbar(newNotification);
    }
  };

  const showSnackbar = (notification) => {
    setCurrentSnackbar(notification);
    setSnackbarOpen(true);
  };

  const hideSnackbar = () => {
    setSnackbarOpen(false);
    setCurrentSnackbar(null);
  };

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notification) => {
    handleNewNotification(notification);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'event': return <Event color="primary" />;
      case 'sms': return <Sms color="info" />;
      case 'announcement': return <Announcement color="secondary" />;
      default: return <Info color="info" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationIcon,
    getPriorityColor
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ mr: 1 }}>
                Mark All Read
              </Button>
            )}
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                  border: notification.priority === 'high' ? '1px solid' : 'none',
                  borderColor: 'error.light'
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {notification.title}
                      </Typography>
                      {notification.priority !== 'normal' && (
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                        />
                      )}
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            bgcolor: 'primary.main',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {!notification.read && (
                    <Button
                      size="small"
                      onClick={() => markAsRead(notification.id)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      Mark Read
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => deleteNotification(notification.id)}
                    sx={{ p: 0.5 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearAllNotifications}
              color="error"
            >
              Clear All Notifications
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {currentSnackbar && (
          <Alert
            onClose={hideSnackbar}
            severity={currentSnackbar.type === 'error' ? 'error' : 'info'}
            sx={{ width: '100%' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {currentSnackbar.title}
            </Typography>
            <Typography variant="body2">
              {currentSnackbar.message}
            </Typography>
          </Alert>
        )}
      </Snackbar>

      {/* Notification FAB */}
      <Fab
        color="primary"
        aria-label="notifications"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 1000
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </Fab>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
