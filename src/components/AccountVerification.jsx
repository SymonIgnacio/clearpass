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
import { auth } from '../firebase'
import { sendEmailVerification as sendFirebaseEmailVerification, signOut } from 'firebase/auth'

const AccountVerification = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [checkingVerification, setCheckingVerification] = useState(false)

  // Get signup data from location state
  const signupData = location.state?.signupData
  const verificationMethod = location.state?.verificationMethod

  useEffect(() => {
    if (!signupData || verificationMethod !== 'email') {
      navigate('/signup')
      return
    }

    // Wait for Firebase auth to be ready, then send verification email
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthLoading(false) // Auth state is now determined

      if (user) {
        // Send initial verification email
        sendEmailVerification()
      } else {
        // User is not authenticated, redirect to signup
        console.error('User not authenticated, redirecting to signup')
        navigate('/signup')
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [signupData, verificationMethod])

  useEffect(() => {
    // Timer for resend button
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const sendEmailVerification = async () => {
    setLoading(true)
    setError('')

    try {
      // Send email verification
      const user = auth.currentUser
      if (user) {
        // Configure email verification with proper settings
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-account?mode=verifyEmail&oobCode=`,
          handleCodeInApp: false
        }

        await sendFirebaseEmailVerification(user, actionCodeSettings)
        setResendTimer(60) // 60 seconds cooldown
      } else {
        throw new Error('User not authenticated')
      }
    } catch (err) {
      console.error('Email verification error:', err)

      // Show specific error messages based on Firebase error codes
      if (err.code === 'auth/too-many-requests') {
        setError('Too many verification emails sent. Please wait 60 seconds before requesting another one.')
      } else if (err.code === 'auth/user-token-expired') {
        setError('Your session has expired. Please sign up again.')
        navigate('/signup')
      } else if (err.code === 'auth/invalid-user-token') {
        setError('Invalid authentication token. Please sign up again.')
        navigate('/signup')
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email verification is not enabled for this project. Please contact support.')
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before verifying your email.')
        navigate('/login')
      } else {
        // Show the actual Firebase error message for debugging
        setError(`Failed to send verification email: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const checkVerificationStatus = async () => {
    setCheckingVerification(true)
    setError('')

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Reload user to check verification status
      await user.reload()

      if (user.emailVerified) {
        await completeVerification()
      } else {
        setError('Email not verified yet. Please check your email and click the verification link, then click "Check Verification Status" again.')
      }
    } catch (err) {
      console.error('Verification check error:', err)
      if (err.message === 'User not authenticated') {
        setError('Your session has expired. Please sign up again.')
        navigate('/signup')
      } else if (err.code === 'auth/user-token-expired') {
        setError('Your session has expired. Please sign up again.')
        navigate('/signup')
      } else {
        setError('Failed to check verification status. Please try again.')
      }
    } finally {
      setCheckingVerification(false)
    }
  }

  const completeVerification = async () => {
    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser.getIdToken()

      // Complete signup with backend
      const response = await fetch('http://localhost:3001/api/auth/complete-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          signupData,
          verificationMethod
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        // Auto-login after successful verification
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        throw new Error(result.message || 'Failed to complete signup')
      }
    } catch (err) {
      console.error('Complete signup error:', err)
      setError('Account created but verification failed. Please contact support.')
    }
  }

  const handleBackToSignup = () => {
    // Sign out from Firebase
    signOut(auth).catch(console.error)
    navigate('/signup')
  }

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

  // Show loading screen while Firebase auth is initializing
  if (authLoading) {
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
              <Email sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Preparing Verification
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Setting up your account verification...
            </Typography>

            <CircularProgress size={40} sx={{ mt: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
              Please wait while we authenticate your account
            </Typography>
          </Paper>
        </Box>
      </Container>
    )
  }

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
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <Email sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            Verify Your Email
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            We've sent a verification link to your email address. Please check your email and click the link to verify your account.
          </Typography>

          <Stepper activeStep={1} sx={{ width: '100%', mb: 3 }}>
            <Step>
              <StepLabel>Account Created</StepLabel>
            </Step>
            <Step>
              <StepLabel>Verify Email</StepLabel>
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
                  Verification email sent to:
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
              2. Click the verification link in the email<br />
              3. Return here and click "Check Verification Status"
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
            onClick={checkVerificationStatus}
            disabled={checkingVerification || loading}
            startIcon={checkingVerification ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            sx={{
              mt: 2,
              mb: 2,
              height: 48,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {checkingVerification ? 'Checking...' : 'Check Verification Status'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 2 }}>
            <Button
              onClick={handleBackToSignup}
              startIcon={<ArrowBack />}
              disabled={loading || checkingVerification}
            >
              Back to Signup
            </Button>

            <Button
              onClick={sendEmailVerification}
              disabled={loading || checkingVerification || resendTimer > 0}
              variant="outlined"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Email'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            © 2025 Barangay Management System
            <br />
            Account Verification Portal
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default AccountVerification
