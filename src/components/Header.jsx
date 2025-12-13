import React from 'react'
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Menu, MenuItem } from '@mui/material'
import { Security, AccountCircle, Logout } from '@mui/icons-material'

const Header = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleClose()
    onLogout()
  }

  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Security sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            Barangay Batia Management System
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
