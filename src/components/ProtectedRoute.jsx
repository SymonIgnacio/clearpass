import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'
import { apiRequest } from '../utils/api'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')

        if (!token || !storedUser) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        // Verify token with backend
        const response = await apiRequest('auth/profile')
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)

        // Check role-based access if required roles are specified
        if (requiredRoles.length > 0) {
          const userRole = userData.role
          if (!requiredRoles.includes(userRole)) {
            setAccessDenied(true)
          }
        }

        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData))

      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requiredRoles])

  // Show loading spinner while checking authentication
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
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Show access denied if user doesn't have required role
  if (accessDenied) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            You don't have permission to access this page. This page requires one of the following roles:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            {requiredRoles.join(', ')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Your current role: {user?.role}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Please contact your administrator if you believe this is an error.
        </Typography>
      </Box>
    )
  }

  // Render protected content with user context
  return React.cloneElement(children, { user })
}

export default ProtectedRoute
