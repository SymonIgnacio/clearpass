import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Check JWT token in localStorage
  const token = localStorage.getItem('authToken')
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user) {
    const userRole = user.role
    if (!requiredRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export default ProtectedRoute
