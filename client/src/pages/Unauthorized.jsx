import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Lock } from '@mui/icons-material'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
        <Lock sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>Access Denied</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  )
}

export default Unauthorized