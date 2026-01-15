import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Lock } from '@mui/icons-material'
import { useAuth } from '../contexts/useAuth'

const Unauthorized = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login')
      return
    }

    const role = Number(user.role)
    switch (role) {
      case 12: // Resident
        navigate('/resident/dashboard')
        break
      case 3: // Secretary
        navigate('/secretary/dashboard')
        break
      case 4: // Clerk
        navigate('/clerk/dashboard')
        break
      case 6: // Blotter Officer
        navigate('/officer/dashboard')
        break
      case 2: // Captain
        navigate('/captain/dashboard')
        break
      default: // Admin (1) or others
        navigate('/')
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
        <Lock sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>Access Denied</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Typography>
        <Button variant="contained" onClick={handleDashboardRedirect}>
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  )
}

export default Unauthorized