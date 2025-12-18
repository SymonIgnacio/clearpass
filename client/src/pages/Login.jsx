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
import { LockOutlined, PersonAdd, Business, Person } from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isUsingUsername, setIsUsingUsername] = useState(false)
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
      console.log('🔐 Attempting resident login...')

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      console.log('✅ Firebase authentication successful:', { uid: user.uid, email: user.email })

      // Get additional user data from the Firebase User object
      const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        role: 'resident',
        auth_type: 'firebase',
        created_at: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      // Store resident authentication data in localStorage
      localStorage.setItem('residentUser', JSON.stringify(userInfo))
      localStorage.setItem('residentAuthToken', await user.getIdToken())
      localStorage.setItem('residentAuthTimestamp', Date.now().toString())

      // Clear any officer auth data to avoid conflicts
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')

      console.log('✅ Resident login successful - proceeding to dashboard')

      // Call onLogin callback to update app state
      if (onLogin) {
        onLogin(userInfo)
      }

      // Navigate to dashboard
      navigate('/')

    } catch (err) {
      console.error('❌ Resident login error:', err)

      let errorMessage = 'Login failed. Please try again.'

      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.'
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.'
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

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'primary.main' }}>
            Resident Login
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Sign in to your resident account to access barangay services
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
              id="email"
              label="Email or Username"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 2 }}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Don't have an account?
              </Typography>
              <Button
                component={Link}
                to="/signup"
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
                Create an Account
              </Button>
            </Box>


          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            © 2025 Barangay Management System
            <br />
            Resident Services Portal
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
