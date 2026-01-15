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
  Stepper,
  Step,
  StepLabel,
  Grid
} from '@mui/material'
import { PersonAdd, LockOutlined, CheckCircle } from '@mui/icons-material'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const steps = ['Verify Residency', 'Create Account']

const Register = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Census Check
  const [censusData, setCensusData] = useState({
    last_name: '',
    resident_id: ''
  })

  // Step 2: Account Creation
  const [accountData, setAccountData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })

  const handleCensusChange = (e) => {
    setCensusData({
      ...censusData,
      [e.target.name]: e.target.value
    })
  }

  const handleAccountChange = (e) => {
    setAccountData({
      ...accountData,
      [e.target.name]: e.target.value
    })
  }

  const handleCensusSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔍 Checking census for resident...')

      const response = await apiRequest('auth/check-census', {
        method: 'POST',
        body: {
          last_name: censusData.last_name,
          resident_id: censusData.resident_id
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Census check failed')
      }

      const data = await response.json()
      console.log('✅ Census check successful:', data)

      // Move to next step
      setActiveStep(1)

    } catch (err) {
      console.error('❌ Census check error:', err)
      setError(err.message || 'Failed to verify residency')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(accountData.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      setLoading(false)
      return
    }

    try {
      console.log('📝 Registering resident account...')

      const response = await apiRequest('auth/register-resident', {
        method: 'POST',
        body: {
          resident_id: censusData.resident_id,
          username: accountData.username,
          password: accountData.password
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const data = await response.json()
      console.log('✅ Registration successful:', data)

      // Login with the token
      login(data.token)

      // Redirect to dashboard
      navigate('/')

    } catch (err) {
      console.error('❌ Registration error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setActiveStep(0)
    setError('')
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
            <PersonAdd sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'primary.main' }}>
            Resident Registration
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Register for your barangay resident account
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box component="form" onSubmit={handleCensusSubmit} sx={{ mt: 1, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Step 1: Verify Your Residency
              </Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                id="last_name"
                label="Last Name"
                name="last_name"
                autoComplete="family-name"
                autoFocus
                value={censusData.last_name}
                onChange={handleCensusChange}
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="resident_id"
                label="Resident ID"
                name="resident_id"
                autoComplete="off"
                value={censusData.resident_id}
                onChange={handleCensusChange}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Residency'}
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box component="form" onSubmit={handleAccountSubmit} sx={{ mt: 1, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Step 2: Create Your Account
              </Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={accountData.username}
                onChange={handleAccountChange}
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
                autoComplete="new-password"
                value={accountData.password}
                onChange={handleAccountChange}
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={accountData.confirmPassword}
                onChange={handleAccountChange}
                disabled={loading}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                  sx={{ height: 48 }}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Already have an account?
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              startIcon={<LockOutlined />}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 500
              }}
            >
              Sign In
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            © 2025 Barangay Management System
            <br />
            Resident Registration Portal
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register
