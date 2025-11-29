import React from 'react'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { Security } from '@mui/icons-material'

const Header = () => {
  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Security sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            Barangay Batia Management System
          </Typography>
        </Box>
        <Typography variant="body1">
          Welcome, Barangay Official
        </Typography>
      </Toolbar>
    </AppBar>
  )
}

export default Header
