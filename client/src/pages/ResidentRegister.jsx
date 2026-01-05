import React, { useState, useEffect } from 'react';
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
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import { PersonAdd, Upload, CheckCircle, ArrowBack } from '@mui/icons-material';

const ResidentRegister = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [households, setHouseholds] = useState([]);
  const [sitios, setSitios] = useState([]);

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
    confirm_password: '',
    household_id: '',
    sitio_id: '',
    id_document: null
  });

  const steps = ['Personal Information', 'Account Details', 'Verification'];

  useEffect(() => {
    fetchHouseholds();
    fetchSitios();
  }, []);

  const fetchHouseholds = async () => {
    try {
      const response = await fetch('/api/households');
      const data = await response.json();
      setHouseholds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching households:', error);
    }
  };

  const fetchSitios = async () => {
    try {
      const response = await fetch('/api/sitios');
      const data = await response.json();
      setSitios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sitios:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      id_document: e.target.files[0]
    });
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 0:
        if (!formData.first_name || !formData.last_name || !formData.birthdate || !formData.gender) {
          setError('Please fill in all required personal information fields');
          return false;
        }
        break;
      case 1:
        if (!formData.email || !formData.password || !formData.confirm_password) {
          setError('Please fill in all account details');
          return false;
        }
        if (formData.password !== formData.confirm_password) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.id_document) {
          setError('Please upload a valid ID document');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/resident-auth/register', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration successful! Your account is pending verification. You will be notified once approved.');
        setTimeout(() => {
          navigate('/resident/login');
        }, 3000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
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
                label="Middle Name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
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
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Civil Status</InputLabel>
                <Select
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleChange}
                  label="Civil Status"
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                  <MenuItem value="Separated">Separated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                helperText="This will be your login username"
              />
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
                helperText="Minimum 6 characters"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Household (Optional)</InputLabel>
                <Select
                  name="household_id"
                  value={formData.household_id}
                  onChange={handleChange}
                  label="Household (Optional)"
                >
                  {households.map((household) => (
                    <MenuItem key={household.Household_ID} value={household.Household_ID}>
                      {household.Household_Number} - {household.Street_Address}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sitio (Optional)</InputLabel>
                <Select
                  name="sitio_id"
                  value={formData.sitio_id}
                  onChange={handleChange}
                  label="Sitio (Optional)"
                >
                  {sitios.map((sitio) => (
                    <MenuItem key={sitio.id} value={sitio.id}>
                      {sitio.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Identity Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please upload a clear photo of your valid government ID (Driver's License, Passport, National ID, etc.)
            </Typography>
            
            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 4, 
              textAlign: 'center',
              mb: 3
            }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="id-upload"
              />
              <label htmlFor="id-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  size="large"
                >
                  Upload ID Document
                </Button>
              </label>
              {formData.id_document && (
                <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                  ✓ {formData.id_document.name}
                </Typography>
              )}
            </Box>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Your account will be reviewed and verified by barangay staff. You will receive an email notification once approved.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ width: '100%', borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Avatar sx={{ 
            bgcolor: 'success.main', 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2 
          }}>
            <CheckCircle sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Registration Successful!
          </Typography>
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
          <Button
            variant="contained"
            component={Link}
            to="/resident/login"
            size="large"
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
            <PersonAdd sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Resident Registration
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Join the Barangay ClearPass System
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Submit Registration'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                size="large"
              >
                Next
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Already have an account?
            </Typography>
            <Button component={Link} to="/resident/login">
              Sign In to Portal
            </Button>
          </Box>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default ResidentRegister;