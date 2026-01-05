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
  Chip,
  Button,
  Paper
} from '@mui/material'
import {
  Dashboard,
  People,
  Gavel,
  Description,
  Assessment,
  SmartToy,
  Security,
  Event,
  Logout,
  Person,
  Settings
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 280

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()

  const allMenuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Overview & Analytics',
      roles: [2, 3, 4, 5, 6, 12]
    },
    {
      text: 'User Management',
      icon: <Person />,
      path: '/users',
      description: 'Manage Staff Accounts',
      roles: [5]
    },
    {
      text: 'Residents',
      icon: <People />,
      path: '/residents',
      description: 'Resident Records',
      roles: [2, 3, 4, 5, 6]
    },
    {
      text: 'Blotter',
      icon: <Gavel />,
      path: '/blotter',
      description: 'Incident Reports',
      roles: [2, 3, 4, 5, 6]
    },
    {
      text: 'Documents',
      icon: <Description />,
      path: '/documents',
      description: 'Certificates & Clearances',
      roles: [2, 3, 4, 5, 6]
    },
    {
      text: 'Census',
      icon: <Assessment />,
      path: '/census',
      description: 'Population Statistics',
      roles: [2, 3, 4, 5, 6]
    },
    {
      text: 'Events',
      icon: <Event />,
      path: '/events',
      description: 'Community Programs',
      roles: [2, 3, 5, 6]
    },
    {
      text: 'AI Hub',
      icon: <SmartToy />,
      path: '/ai-dashboard',
      description: 'AI Analytics',
      badge: 'AI',
      roles: [2, 3, 4, 5, 6, 12]
    }
  ]

  // SECURITY FIX: Settings only visible to admin (role 5)
  if (user && Number(user.role) === 5) {
    allMenuItems.push({
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      description: 'System Configuration',
      roles: [5]
    })
  }

  const menuItems = allMenuItems.filter(item => {
    if (!user || !user.role) return false
    
    const userRole = Number(user.role)
    return item.roles.some(role => Number(role) === userRole)
  })

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
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
            <Security sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500, fontSize: '1.125rem', color: 'text.primary' }}>
              Barangay MS
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
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
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '& .MuiListItemText-primary': { color: 'primary.contrastText', fontWeight: 500 },
                    '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' },
                  },
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.main' : 'rgba(26, 115, 232, 0.04)',
                    '& .MuiListItemIcon-root': { color: isActive ? 'primary.contrastText' : 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.contrastText' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: isActive ? 500 : 400, fontSize: '0.875rem' }}>
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
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', mt: 0.25 }}>
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

      {user && (
        <Box sx={{ p: 2, mx: 2 }}>
          <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'primary.main' }}>
                <Person sx={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }} noWrap>
                  {user.username || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {user.role || 'Staff'}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={logout}
              startIcon={<Logout />}
              sx={{
                borderRadius: 2,
                py: 0.75,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'error.main', color: 'white', borderColor: 'error.main' },
              }}
            >
              Logout
            </Button>
          </Paper>
        </Box>
      )}
    </Drawer>
  )
}

export default Sidebar
