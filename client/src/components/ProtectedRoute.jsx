import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'
import { apiRequest } from '../utils/api'

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      let authSuccess = false
      let authUser = null

      try {
        // Check for officer authentication (database + JWT)
        const officerToken = localStorage.getItem('authToken')
        const officerUser = localStorage.getItem('user')

        // Check for resident authentication (Firebase-only)
        const residentUser = localStorage.getItem('residentUser')
        const residentToken = localStorage.getItem('residentAuthToken')

        // Both authentication methods missing
        if ((!officerToken || !officerUser) && (!residentUser || !residentToken)) {
          authSuccess = false
        }
        // Officer authentication - just validate localStorage data
        else if (officerToken && officerUser) {
          try {
            const userData = JSON.parse(officerUser)
            // Validate the stored user object has required fields
            if (userData && userData.id && userData.username && userData.role) {
              authUser = userData
              authSuccess = true
              console.log('✅ Officer authentication verified via localStorage')
            } else {
              console.log('❌ Officer user data validation failed')
              authSuccess = false
            }
          } catch (error) {
            console.error('❌ Officer authentication failed:', error)
            // Officer data invalid - clear it and try resident auth
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            authSuccess = false
          }
        }

        // Resident authentication (check if officer auth failed or not present)
        if (!authSuccess && residentUser && residentToken) {
          try {
            const userData = JSON.parse(residentUser)
            // For residents, just validate the localStorage data exists and is valid
            // Firebase handles session management client-side, so we trust the stored data
            if (userData && userData.uid && userData.email && userData.role === 'resident') {
              authUser = userData
              authSuccess = true
              console.log('✅ Resident authentication verified via localStorage')
            } else {
              console.log('❌ Resident user data validation failed')
              authSuccess = false
            }
          } catch (error) {
            console.error('❌ Resident authentication failed:', error)
            // Resident data invalid - clear it
            localStorage.removeItem('residentUser')
            localStorage.removeItem('residentAuthToken')
            authSuccess = false
          }
        }

      } catch (error) {
        console.error('Authentication check failed:', error)
        authSuccess = false
      } finally {
        // Set authentication state based on results
        setIsAuthenticated(authSuccess)
        if (authSuccess && authUser) {
          setUser(authUser)
        }
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

  // Redirect to appropriate login page if not authenticated
  if (!isAuthenticated) {
    // Check if user was a staff member by examining stored user data before cleanup
    const storedUser = localStorage.getItem('user')
    let loginPath = '/login' // Default to resident login

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        const staffRoles = ['admin', 'captain', 'secretary', 'clerk']
        if (parsedUser.role && staffRoles.includes(parsedUser.role)) {
          loginPath = '/officerlogin'
        }
      } catch (error) {
        console.error('Error parsing stored user data for login redirect:', error)
      }
    }

    return <Navigate to={loginPath} replace />
  }

    // Check role-based access if required roles are specified
    if (requiredRoles.length > 0) {
      const userRole = user.role
      const hasRequiredRole = requiredRoles.includes(userRole)

      if (!hasRequiredRole) {
        // Redirect unauthorized users to home/dashboard
        return <Navigate to="/" replace />
      }
    }

  // Render protected content with user context
  return React.cloneElement(children, { user })
}

export default ProtectedRoute
