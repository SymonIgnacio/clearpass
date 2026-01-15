import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: { xs: 'calc(100vw - 32px)', sm: 360 }, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                {!notification.is_read && (
                  <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mr: 1 }} />
                )}
                <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: notification.is_read ? 400 : 600 }}>
                  {notification.title}
                </Typography>
                {notification.type !== 'info' && (
                  <Chip
                    label={notification.type}
                    size="small"
                    color={getTypeColor(notification.type)}
                    sx={{ height: 20, fontSize: '0.625rem', ml: 1 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, whiteSpace: 'pre-line' }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(notification.created_at)}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
