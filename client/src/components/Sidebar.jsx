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
  Paper,
  Tooltip
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
  Logout,
  AdminPanelSettings,
  SupervisorAccount,
  Person,
  Analytics,
  DocumentScanner,
  Settings,
  Lock
} from '@mui/icons-material'

const drawerWidth = 280

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation()

  // Menu items with role-based access control - hide items user doesn't have access to
  const allMenuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Overview & Analytics',
      roles: ['admin', 'captain', 'secretary', 'clerk', 'officer', 'resident'] // All roles can access
    },
    {
      text: 'User Management',
      icon: <SupervisorAccount />,
      path: '/users',
      description: 'Manage Staff Accounts & Roles',
      roles: ['admin'] // IT Admin (1) ONLY
    },

    {
      text: 'Residents',
      icon: <People />,
      path: '/residents',
      description: 'Resident Records Management',
      roles: ['admin', 'captain', 'secretary', 'clerk'] // Admin, Captain, Secretary, Clerk
    },
    {
      text: 'Blotter',
      icon: <Gavel />,
      path: '/blotter',
      description: 'Incident Reports & Case Management',
      roles: ['admin', 'captain', 'officer'] // Admin, Captain, Officer (NOT Clerk, NOT Secretary)
    },
    {
      text: 'Document Center',
      icon: <Description />,
      path: '/documents',
      description: 'Certificates & Clearance Processing',
      roles: ['admin'] // IT Admin (1) ONLY
    },

    {
      text: 'AI Hub',
      icon: <SmartToy />,
      path: '/ai-dashboard',
      description: 'AI Analytics & Assistant',
      badge: 'AI',
      roles: ['admin', 'captain', 'secretary', 'clerk', 'officer', 'resident'] // All roles
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      description: 'Account Settings & System Config',
      roles: ['admin', 'captain', 'secretary', 'clerk', 'officer', 'resident'] // All roles
    }
  ]

  // Filter menu items based on user role - THEMIS ClearPass compatibility
  const menuItems = allMenuItems.filter(item => {
    if (!user || !user.role) return false

    // THEMIS ClearPass: Handle both numeric THEMIS roles and legacy string roles
    const THEMIS_ROLE_MAP = {
      1: 'admin',           // IT Admin
      2: 'clerk',           // Clerk
      3: 'officer',         // Blotter Officer
      4: 'resident',        // Resident
      5: 'captain',         // Captain
      6: 'secretary'        // Secretary
    }

    // Convert numeric THEMIS role to string for compatibility, or use as-is if already string
    const userRole = typeof user.role === 'number' ? THEMIS_ROLE_MAP[user.role] || user.role : user.role

    // Check if user role is in item's allowed roles
    return item.roles.includes(userRole)
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

      {/* User Info Section */}
      {user && (
        <Box sx={{ p: 2, mx: 2 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1.5,
                  bgcolor: user.role_name === 'Super Admin' ? 'error.main' :
                           user.role_name === 'Barangay Captain' ? 'warning.main' :
                           'primary.main'
                }}
              >
                {user.role_name === 'Super Admin' ? <AdminPanelSettings sx={{ fontSize: 16 }} /> :
                 user.role_name === 'Barangay Captain' ? <SupervisorAccount sx={{ fontSize: 16 }} /> :
                 <Person sx={{ fontSize: 16 }} />}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }} noWrap>
                  {user.full_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {user.role_name}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={onLogout}
              startIcon={<Logout />}
              sx={{
                borderRadius: 2,
                py: 0.75,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white',
                  borderColor: 'error.main',
                },
              }}
            >
              Logout
            </Button>
          </Paper>
        </Box>
      )}

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
