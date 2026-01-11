import React, { useState } from 'react'
import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const MfaOtp = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const verify = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiRequest('auth/mfa/verify', {
        method: 'POST',
        body: { otp }
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || data.message || 'OTP verification failed')
      }
      setSuccess('MFA verified successfully')
      await refreshUser()
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiRequest('auth/mfa/request', { method: 'POST', body: {} })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to resend OTP')
      }
      setSuccess('OTP sent')
    } catch (e) {
      setError(e.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            OTP Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the 6-digit code sent to {user?.email || 'your email'}.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            label="OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={resend} disabled={resending || loading}>
              Resend OTP
            </Button>
            <Button variant="contained" onClick={verify} disabled={loading || otp.length !== 6}>
              Verify
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default MfaOtp
