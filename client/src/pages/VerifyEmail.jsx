import React, { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { Email, MarkEmailRead } from '@mui/icons-material';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const verify = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiRequest('resident-auth/verify-email', {
        method: 'POST',
        body: { otp },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Verification failed');
      }
      setSuccess('Email verified successfully!');
      // Refresh user context to update email_verified status
      await refreshUser();
      // Redirect to dashboard
      setTimeout(() => navigate('/resident/dashboard', { replace: true }), 1500);
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiRequest('resident-auth/send-verification', {
        method: 'POST',
        body: {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send code');
      }
      setSuccess('Verification code sent to ' + (user?.email || 'your email'));
    } catch (e) {
      setError(e.message || 'Failed to send code');
    } finally {
      setResending(false);
    }
  };

  return (
    <Container maxWidth='sm'>
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MarkEmailRead sx={{ fontSize: 60, color: '#1a73e8', mb: 2 }} />
            <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
              Verify Your Email
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              We've sent a 6-digit code to <strong>{user?.email}</strong>. Please enter it below to
              verify your account.
            </Typography>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            label='Verification Code'
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            placeholder='123456'
            inputProps={{
              inputMode: 'numeric',
              style: { letterSpacing: '0.5em', fontSize: '1.2em', textAlign: 'center' },
            }}
            sx={{ mb: 3 }}
          />

          <Button
            variant='contained'
            fullWidth
            size='large'
            onClick={verify}
            disabled={loading || otp.length !== 6}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <Button variant='text' fullWidth onClick={resend} disabled={resending || loading}>
            {resending ? 'Sending...' : "Didn't receive a code? Resend"}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
