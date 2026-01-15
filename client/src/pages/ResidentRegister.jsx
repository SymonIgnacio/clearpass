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
    gender: '',
    civil_status: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);

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
          gender: formData.gender,
          civil_status: formData.civil_status,
          password: formData.password
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration successful! Redirecting...');
        
        // Auto-login logic
        if (data.token) {
          // Set cookie manually to ensure immediate availability
          document.cookie = `authToken=${data.token}; path=/; max-age=86400`; // 24 hours
          
          // Refresh auth context
          await refreshUser();
          
          // Navigate to dashboard with verification prompt
          navigate('/resident/dashboard', { 
            state: { showVerification: true },
            replace: true 
          });
        } else {
          // Fallback if no token (shouldn't happen with updated backend)
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonAdd sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
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
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                  <MenuItem value="Separated">Separated</MenuItem>
                </TextField>
              </Grid>
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

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                sx={{ flex: 1 }}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/resident/login')}
                sx={{ flex: 1 }}
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
            Your account has been created and is pending verification. 
            To speed up the approval process, please prepare the following documents:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Valid Government ID</strong> (for identity verification)
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>4Ps ID / DSWD Certificate</strong> (if applying for 4Ps beneficiary status)
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>PWD ID / Medical Certificate</strong> (if applying for PWD status)
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Barangay Clearance</strong> (if available)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/resident/login')} autoFocus variant="contained">
            I Understand, Proceed to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentRegister;
