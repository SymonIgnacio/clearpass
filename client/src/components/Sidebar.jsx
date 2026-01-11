import React, { useState } from 'react'
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
  Collapse
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
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
  Settings,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
  FolderShared,
  Assignment
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export const DRAWER_WIDTH = 280

const Sidebar = ({ mobileOpen = false, onMobileClose = () => {} }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [openSubmenus, setOpenSubmenus] = useState({
    residentServices: true,
    caseManagement: true,
    administration: true,
    analytics: true
  })

  const handleToggleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const menuStructure = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
      description: 'Overview & Analytics',
      roles: [1, 2, 3, 4, 6, 12]
    },
    {
      text: 'Resident Services',
      icon: <People />,
      key: 'residentServices',
      roles: [1, 2, 3, 4], // Visible to Admin, Captain, Secretary, Clerk
      children: [
        {
          text: 'Resident Records',
          path: '/residents',
          roles: [1, 2, 3] // Admin, Captain, Secretary
        },
        {
          text: 'Certificates',
          path: '/clerk/documents', // Consolidated Document Issuance
          roles: [1, 4] // Admin, Clerk
        },
        {
          text: 'Registration & Document Review',
          path: '/secretary/document-verification',
          roles: [1, 3] // Admin, Secretary
        },
        {
          text: 'Beneficiary Eligibility Review',
          path: '/secretary/beneficiaries',
          roles: [1, 3] // Admin, Secretary
        }
      ]
    },
    {
      text: 'Case Management',
      icon: <Gavel />,
      key: 'caseManagement',
      roles: [1, 3, 6], // Admin, Secretary, Blotter Officer
      children: [
        {
          text: 'Blotter Records',
          path: '/blotter',
          roles: [1, 3, 6]
        }
      ]
    },
    {
      text: 'Analytics',
      icon: <Assessment />,
      key: 'analytics',
      roles: [1, 2, 3, 4, 6],
      children: [
        {
          text: 'Reports',
          path: '/reports',
          roles: [1, 2, 3]
        },
        {
          text: 'AI Insights',
          path: '/ai-analytics',
          roles: [1, 2, 3, 4, 6],
          badge: 'AI'
        }
      ]
    },
    {
      text: 'Administration',
      icon: <AdminPanelSettings />,
      key: 'administration',
      roles: [1], // Admin only
      children: [
        {
          text: 'User Management',
          path: '/admin/staff',
          roles: [1]
        },
        {
          text: 'System Logs',
          path: '/admin/logs',
          roles: [1]
        },
        {
          text: 'Settings',
          path: '/admin/settings',
          roles: [1]
        },
        {
          text: 'Backup & Restore',
          path: '/admin/backup',
          roles: [1]
        }
      ]
    }
  ]

  // Filter menu items based on user role
  const getVisibleItems = (items) => {
    if (!user || !user.role) return []
    const userRole = Number(user.role)

    return items.reduce((acc, item) => {
      // Check if user has role for this item
      const hasRole = item.roles.includes(userRole)
      
      if (item.children) {
        // Recursively filter children
        const visibleChildren = getVisibleItems(item.children)
        
        // If user has access to parent OR at least one child
        if (hasRole || visibleChildren.length > 0) {
          acc.push({ ...item, children: visibleChildren })
        }
      } else if (hasRole) {
        acc.push(item)
      }
      return acc
    }, [])
  }

  const visibleMenu = getVisibleItems(menuStructure)

  const renderMenuItem = (item) => {
    const isParent = item.children && item.children.length > 0
    const isOpen = openSubmenus[item.key]
    const isActive = !isParent && location.pathname === item.path

    if (isParent) {
      return (
        <React.Fragment key={item.text}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleToggleSubmenu(item.key)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 2,
                '&:hover': { backgroundColor: 'rgba(26, 115, 232, 0.04)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
              />
              {isOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child))}
            </List>
          </Collapse>
        </React.Fragment>
      )
    }

    return (
      <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          component={NavLink}
          to={item.path}
          onClick={() => {
            if (isMobile) onMobileClose()
          }}
          sx={{
            borderRadius: 2,
            py: 1,
            px: 2,
            pl: item.icon ? 2 : 7, // Indent if no icon (child item)
            transition: 'all 0.2s ease-in-out',
            '&.active': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 2px 8px rgba(26, 115, 232, 0.25)',
              '& .MuiListItemText-primary': { color: 'primary.contrastText', fontWeight: 500 },
              '& .MuiListItemIcon-root': { color: 'primary.contrastText' }
            },
            '&:hover': {
              backgroundColor: isActive ? 'primary.main' : 'rgba(26, 115, 232, 0.04)',
            },
          }}
        >
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.contrastText' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
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
          />
        </ListItemButton>
      </ListItem>
    )
  }

  const drawer = (
    <>
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
        {visibleMenu.map((item) => renderMenuItem(item))}
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
                  {user.role_name || 'Staff'}
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
    </>
  )

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }} aria-label="sidebar navigation">
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          anchor="left"
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          anchor="left"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  )
}

export default Sidebar
