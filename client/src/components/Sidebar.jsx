import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
  Avatar,
  Chip
} from '@mui/material'
import {
  Dashboard,
  People,
  Gavel,
  Description,
  Assessment,
  SmartToy,
  Security,
  QrCodeScanner,
  Event,
  Analytics,
  Assignment,
  Group,
  VerifiedUser
} from '@mui/icons-material'

const drawerWidth = 280

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Overview & Analytics'
    },
    {
      text: 'Residents',
      icon: <People />,
      path: '/residents',
      description: 'Manage Residents'
    },
    {
      text: 'Blotter',
      icon: <Gavel />,
      path: '/blotter',
      description: 'Incident Reports'
    },
    {
      text: 'Certificates',
      icon: <Description />,
      path: '/certificates',
      description: 'Issue Documents'
    },
    {
      text: 'Census',
      icon: <Assessment />,
      path: '/census',
      description: 'Population Stats'
    },
    {
      text: 'AI Patrol',
      icon: <SmartToy />,
      path: '/ai-patrol',
      description: 'Smart Deployment',
      badge: 'AI'
    },
    {
      text: 'QR Verify',
      icon: <QrCodeScanner />,
      path: '/qr-verify',
      description: 'Document Verification'
    },
    {
      text: 'Events',
      icon: <Event />,
      path: '/events',
      description: 'Community Programs'
    },
  ]

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e8eaed',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <Security sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 500,
                fontSize: '1.125rem',
                color: 'text.primary'
              }}
            >
              Barangay MS
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              Management System
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ mx: 2, my: 1 }} />

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&.active': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: '0 2px 8px rgba(26, 115, 232, 0.25)',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.contrastText',
                      fontWeight: 500,
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.main' : 'rgba(26, 115, 232, 0.04)',
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'primary.contrastText' : 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: isActive ? 'primary.contrastText' : 'text.secondary'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 500 : 400,
                          fontSize: '0.875rem'
                        }}
                      >
                        {item.text}
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.625rem',
                            fontWeight: 500,
                            bgcolor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                            color: isActive ? 'primary.contrastText' : 'white',
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        mt: 0.25
                      }}
                    >
                      {item.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2, mx: 2, mb: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(26, 115, 232, 0.04)',
            border: '1px solid rgba(26, 115, 232, 0.12)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            AI-Powered System
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Intelligent decision support for barangay administration and community safety.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  )
}

export default Sidebar
