import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth()

  // Show loading spinner while AuthContext is initializing
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0) {
    // THEMIS ClearPass: Strict numeric role checking only
    const userRole = user.role
    const hasRequiredRole = requiredRoles.includes(userRole)

    console.log('🔐 ProtectedRoute access check:', {
      userRole: userRole,
      requiredRoles: requiredRoles,
      hasAccess: hasRequiredRole
    })

    if (!hasRequiredRole) {
      // Redirect unauthorized users to home/dashboard
      return <Navigate to="/" replace />
    }
  }

  // Render protected content with user context
  return React.cloneElement(children, { user })
}

export default ProtectedRoute
