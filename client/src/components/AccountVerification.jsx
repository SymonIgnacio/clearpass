import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { VerifiedUser, Email, ArrowBack, CheckCircle, Refresh } from '@mui/icons-material'
import api from '../utils/api'

const AccountVerification = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Get signup data from location state
  const signupData = location.state?.signupData
  const verificationMethod = location.state?.verificationMethod

  useEffect(() => {
    // In the new JWT system, email verification is automatic
    // This component now serves as a confirmation page
    if (!signupData || verificationMethod !== 'email') {
      navigate('/register')
      return
    }

    // Auto-redirect to login after showing success message
    const timer = setTimeout(() => {
      navigate('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [signupData, verificationMethod, navigate])

  if (!signupData || !verificationMethod) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" color="error">
            Invalid verification session. Redirecting to signup...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (success) {
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
            <Avatar sx={{ m: 1, bgcolor: 'success.main', width: 56, height: 56 }}>
              <CheckCircle sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Account Verified Successfully!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Your account has been created and verified. You can now log in to access the system.
            </Typography>

            <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
              You will be redirected to the login page in a few seconds...
            </Alert>

            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: 2
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  // Main verification screen
  return (
    <Container component="main" maxWidth="sm">
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
          <Avatar sx={{ m: 1, bgcolor: 'success.main', width: 56, height: 56 }}>
            <CheckCircle sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Account Created Successfully!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Welcome to the Barangay Management System. A verification email has been sent to your email address.
          </Typography>

          <Stepper activeStep={1} sx={{ width: '100%', mb: 3 }}>
            <Step>
              <StepLabel>Account Created</StepLabel>
            </Step>
            <Step>
              <StepLabel>Email Sent</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete Setup</StepLabel>
            </Step>
          </Stepper>

          <Card variant="outlined" sx={{ width: '100%', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Welcome email sent to:
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {signupData.email}
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            <Typography variant="body2">
              <strong>Next steps:</strong><br />
              1. Check your email inbox (and spam folder)<br />
              2. You can now log in to access the system<br />
              3. Complete residency verification in Settings to access documents and certificates
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              mt: 2,
              mb: 2,
              height: 48,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Continue to Login
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            You will be automatically redirected to login in 5 seconds...
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            © 2025 Barangay Management System
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default AccountVerification
