import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { apiRequest } from '../utils/api'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }, [])

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

  // Render protected content with user context
  return React.cloneElement(children, { user })
}

export default ProtectedRoute
