import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../utils/api';

import { useAuth } from '../contexts/useAuth';

const ResidentRegister = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    birthdate: '',
    birth_place: '',
    gender: '',
    civil_status: '',
    password: '',
    confirmPassword: '',
    street_address: '',
    sitio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);

  const SITIOS = ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest('/resident-auth/register', {
        method: 'POST',
        body: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          email: formData.email,
          mobile_number: formData.mobile_number,
          birthdate: formData.birthdate,
          birth_place: formData.birth_place,
          gender: formData.gender,
          civil_status: formData.civil_status,
          password: formData.password,
          street_address: formData.street_address,
          sitio: formData.sitio
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration successful! Redirecting...');
        
        // Auto-login logic
        if (data.token) {
          // Cookie is now set by the server (HttpOnly)
          
          // Refresh auth context
        await refreshUser();
        
        // Check if email verification is needed (Guest role)
        const user = data.user;
        if (user && user.role === 13 && user.email_verified === false) {
           // Send initial verification email if not sent automatically by backend (backend sends it)
           navigate('/guest/verify-email', { replace: true });
        } else {
           // Navigate to dashboard with verification prompt
           navigate('/resident/dashboard', { 
             state: { showVerification: true },
             replace: true 
           });
        }
        } else {
          setRequirementsModalOpen(true);
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <PersonAdd sx={{ mr: 2, fontSize: 36, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Resident Registration
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your barangay resident account
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Personal Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Birth Place"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleChange}
                  placeholder="City/Municipality, Province"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  sx={{ width: '100%', minWidth: '150px' }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Civil Status"
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleChange}
                  required
                  sx={{ width: '100%', minWidth: '150px' }}
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                  <MenuItem value="Separated">Separated</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Contact & Address Section */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Contact & Address
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address / House No."
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Block 1 Lot 2, Main St."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Sitio"
                  name="sitio"
                  value={formData.sitio}
                  onChange={handleChange}
                  required
                  sx={{ width: '100%' }}
                >
                  {SITIOS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Account Security Section */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Account Security
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                sx={{ flex: 1, py: 1.5, fontSize: '1.1rem' }}
              >
                {loading ? 'Registering...' : 'Register Account'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/resident/login')}
                sx={{ flex: 1, py: 1.5, fontSize: '1.1rem' }}
              >
                Back to Login
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={requirementsModalOpen}
        onClose={() => navigate('/resident/login')}
        aria-labelledby="requirements-dialog-title"
        aria-describedby="requirements-dialog-description"
      >
        <DialogTitle id="requirements-dialog-title">
          Registration Successful!
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="requirements-dialog-description">
            Your account has been created. To verify your residency, please log in and upload your proof of residency (Valid ID or Utility Bill).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/resident/login')} autoFocus variant="contained">
            Proceed to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentRegister;
