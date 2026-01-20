import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import { Person, Home, Security } from '@mui/icons-material';
import { useAuth } from '../contexts/useAuth';

const ResidentLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(
        { email: formData.email, password: formData.password },
        { endpoint: '/resident-auth/login' }
      )
      
      // Check for MFA Requirement
      if (response && response.mfa_required) {
        navigate('/mfa-otp', { replace: true });
      } else {
        navigate('/resident/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ width: '100%', borderRadius: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1a73e8 0%, #34a853 100%)',
          color: 'white',
          p: 4,
          textAlign: 'center'
        }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2 
          }}>
            <Home sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Resident Portal
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Barangay ClearPass System
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                mb: 3
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In to Portal'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              New Resident?
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            component={Link}
            to="/resident/register"
            startIcon={<Person />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 500,
              mb: 2
            }}
          >
            Register New Account
          </Button>
        </CardContent>

        {/* Footer */}
        <Box sx={{ 
          bgcolor: 'grey.50', 
          p: 2, 
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            Secure • Confidential • 24/7 Access
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResidentLogin;
