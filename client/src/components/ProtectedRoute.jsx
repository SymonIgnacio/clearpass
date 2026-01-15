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
    const loginTarget = requiredRoles.includes(12) ? '/login' : '/officerlogin'
    return <Navigate to={loginTarget} replace />
  }

  const requiresMfa = [1, 3, 4].includes(Number(user.role)) && user.mfa_verified !== true
  if (requiresMfa && location.pathname !== '/mfa') {
    return <Navigate to="/mfa" replace />
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
