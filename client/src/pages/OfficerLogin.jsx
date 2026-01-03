import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Grid
} from '@mui/material'
import { LockOutlined, PersonAdd } from '@mui/icons-material'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const OfficerLogin = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 OfficerLogin: Attempting login with credentials');

      const response = await apiRequest('auth/login', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed');
      }

      const responseData = await response.json()
      const { token, user } = responseData

      console.log('🔐 OfficerLogin: Received token and user data from server');

      if (!token) {
        throw new Error('No authentication token received from server');
      }

      // Authenticate user with AuthContext
      login(token)

      console.log('🔐 OfficerLogin: AuthContext login completed successfully');

      // Navigate to role-specific dashboard based on user role
      if (user && user.role) {
        if (user.role === 'captain') {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === 'secretary') {
          navigate('/secretary/dashboard', { replace: true });
        } else if (user.role === 'clerk') {
          navigate('/clerk/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('❌ OfficerLogin: Login error:', err)

      // Enhanced error handling with more specific messages
      let errorMessage = 'Login failed. Please try again.'

      if (err.message) {
        // Handle specific error types
        if (err.message.includes('Invalid token')) {
          errorMessage = 'Authentication failed. Please contact support if this persists.'
        } else if (err.message.includes('401')) {
          errorMessage = 'Invalid credentials. Please check your username and password.'
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied. Your account may not have permission to log in.'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.'
        } else if (err.message.includes('No authentication token')) {
          errorMessage = 'Authentication failed. Please contact support.'
        } else {
          errorMessage = `Login failed: ${err.message}`
        }
      }

      // Try to get error details from response if available
      if (err.response) {
        try {
          const errorData = await err.response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LockOutlined sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Officer Login
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Sign in to access the barangay management system
          </Typography>

          <Typography variant="body2" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
            Staff & Officers Only
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}



          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 2 }}
              helperText="Use your staff username (e.g., captain, secretary)"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                height: 48,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In as Officer'}
            </Button>



            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                For residents and the general public:
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                startIcon={<PersonAdd />}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 500
                }}
              >
                Use Resident Login
              </Button>
            </Box>
          </Box>



          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            © 2025 Barangay Management System
            <br />
            Authorized Personnel Access
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default OfficerLogin
