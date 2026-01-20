import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../contexts/useAuth'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Check authentication status
  if (!isAuthenticated || !user) {
    // Default to resident login for better UX
    const loginTarget = requiredRoles.includes(1) || requiredRoles.includes(6) ? '/officerlogin' : '/resident/login'
    return <Navigate to={loginTarget} replace />
  }

  // MFA Verification Check
  // Roles 1 (Admin), 3 (Secretary), 4 (Clerk), and 12 (Resident) require MFA
  const requiresMfa = [1, 3, 4, 12].includes(Number(user.role)) && user.mfa_verified !== true
  if (requiresMfa && location.pathname !== '/mfa' && location.pathname !== '/mfa-otp') {
    return <Navigate to="/mfa-otp" replace />
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user) {
    const userRole = Number(user.role)
    const hasAccess = requiredRoles.some(role => Number(role) === userRole)

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export default ProtectedRoute
