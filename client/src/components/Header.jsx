import React from 'react'
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Menu, MenuItem } from '@mui/material'
import { Security, AccountCircle, Logout, Brightness4, Brightness7, Menu as MenuIcon } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useThemeMode } from '../contexts/ThemeModeContext.jsx'
import NotificationBell from './NotificationBell'

const Header = ({ showMenuButton = false, onOpenSidebar = () => {} }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const { user, logout } = useAuth()
  const { mode, toggleDarkMode } = useThemeMode()

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleClose()
    logout()
  }

  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {showMenuButton && (
            <IconButton size="large" color="inherit" onClick={onOpenSidebar} aria-label="open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Security sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            Barangay Batia Management System
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="large" color="inherit" onClick={toggleDarkMode} aria-label="toggle dark mode">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <NotificationBell />
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Welcome, {user.full_name}
              </Typography>
              <Chip
                label={user.role_name}
                size="small"
                color={
                  user.role_name === 'Super Admin' ? 'error' :
                  user.role_name === 'Barangay Captain' ? 'warning' :
                  'primary'
                }
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>

            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <Typography variant="body2">
                  {user.full_name}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Typography variant="caption" color="text.secondary">
                  {user.role_name} • Level {user.hierarchy_level}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Header
