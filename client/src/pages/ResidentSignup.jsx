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
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from '@mui/material'
import { PersonAdd, Email, ArrowBack } from '@mui/icons-material'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const ResidentSignup = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const steps = ['Account Details', 'Create Account']

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const validateStep = (step) => {
    switch (step) {
      case 0: // Account Details
        if (!formData.username.trim()) return 'Username is required'
        if (!formData.email.trim()) return 'Email is required'
        if (!formData.password) return 'Password is required'
        if (formData.password.length < 6) return 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
        if (!formData.full_name.trim()) return 'Full name is required'
        return null

      default:
        return null
    }
  }

  const handleCreateAccount = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Starting resident signup process...')

      // Firebase-only authentication for residents
      console.log('🔥 Creating Firebase account...')
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      console.log('✅ Firebase account created successfully')

      console.log('🎉 Resident signup completed successfully - Firebase auth only')

      // For residents, we just need to authenticate with Firebase
      // They get direct access with their Firebase identity
      // Store basic user info for UI purposes, but no backend records
      const userInfo = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || formData.full_name,
        role: 'resident',
        auth_type: 'firebase_only'
      }

      // Store in localStorage for frontend state management
      localStorage.setItem('residentUser', JSON.stringify(userInfo))
      localStorage.setItem('residentAuthToken', await userCredential.user.getIdToken())

      console.log('🎉 Resident signup and authentication completed successfully')

      // Show success message briefly, then navigate
      setTimeout(() => {
        console.log('🚀 Redirecting to resident dashboard...')
        navigate('/', { replace: true })
      }, 2000)

    } catch (err) {
      console.error('❌ Account creation error:', err)

      // Handle Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please try logging in instead.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please enter a valid email.')
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.')
      } else {
        setError(err.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0: // Account Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                helperText="We'll send a verification email to this address"
                sx={{ mb: 2 }}
              />
            </Grid>



            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="full_name"
                label="Full Name"
                name="full_name"
                autoComplete="name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={loading}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                helperText="Minimum 6 characters"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
          </Grid>
        )

      case 1: // Create Account
        return (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Ready to create your account?
            </Typography>

            <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Account Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Username:</Typography>
                  <Typography variant="body2">{formData.username}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Full Name:</Typography>
                  <Typography variant="body2">{formData.full_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body2">{formData.email}</Typography>
                </Box>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                Your account will be created instantly! After signup, you can optionally verify your email in Account Settings to become a registered resident. For full access, submit residency verification through an officer.
              </Typography>
            </Alert>

            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateAccount}
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
        )

      default:
        return 'Unknown step'
    }
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
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

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Resident Signup
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Create your account and verify your identity
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
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

          <Box sx={{ width: '100%', mb: 3 }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            <Button
              component={Link}
              to="/login"
              disabled={loading}
            >
              Already have an account? Login
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => {
                  const validationError = validateStep(activeStep)
                  if (validationError) {
                    setError(validationError)
                  } else {
                    setError('')
                    handleNext()
                  }
                }}
                disabled={loading}
              >
                Next
              </Button>
            ) : null}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            © 2025 Barangay Management System
            <br />
            Secure Resident Account Registration
          </Typography>
        </Paper>
      </Box>

      {/* reCAPTCHA container for SMS verification */}
      <div id="recaptcha-container"></div>
    </Container>
  )
}

export default ResidentSignup
