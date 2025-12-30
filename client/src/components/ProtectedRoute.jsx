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
    // THEMIS ClearPass: Handle both numeric THEMIS roles and legacy string roles
    const THEMIS_ROLE_MAP = {
      1: 'admin',           // IT Admin
      2: 'clerk',           // Clerk
      3: 'blotter_officer', // Blotter Officer
      4: 'resident',        // Resident
      5: 'captain',         // Captain
      6: 'secretary'        // Secretary
    }

    // Check both numeric THEMIS roles and string roles for backward compatibility
    const userRoleNumeric = user.role // Keep original numeric role
    const userRoleString = typeof user.role === 'number' ? THEMIS_ROLE_MAP[user.role] || user.role : user.role

    // Check if user has access with either numeric or string role matching
    const hasRequiredRole = requiredRoles.some(requiredRole => {
      if (typeof requiredRole === 'number') {
        // Check numeric role match
        return userRoleNumeric === requiredRole
      } else if (typeof requiredRole === 'string') {
        // Check string role match
        return userRoleString === requiredRole
      }
      return false
    })

    console.log('🔐 ProtectedRoute access check:', {
      userRole: user.role,
      userRoleNumeric,
      userRoleString,
      requiredRoles,
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
