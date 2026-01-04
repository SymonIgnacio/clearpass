import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Save,
  Lock,
  Security,
  Notifications,
  Palette,
  Language,
  Help,
  AccountCircle,
  VerifiedUser,
  Send,
  CloudUpload,
  Description,
  CheckCircle,
  Pending,
  Error
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const ResidentSettings = ({ user }) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    contact_number: user?.contact_number || ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'en'
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmPasswordDialog, setConfirmPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [residencyVerification, setResidencyVerification] = useState({
    proof_type: '',
    notes: '',
    selectedFile: null,
    submitting: false
  });
  const [residencyStatus, setResidencyStatus] = useState(null);

  useEffect(() => {
    // Load user preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Failed to parse saved preferences:', e);
      }
    }
  }, []);

  const handleProfileChange = (field) => (event) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePreferenceChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));

    // Save to localStorage immediately
    const newPrefs = { ...preferences, [field]: value };
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profile.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (profile.contact_number && !/^[\d\s\-\+\(\)]+$/.test(profile.contact_number)) {
      newErrors.contact_number = 'Please enter a valid contact number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...user, ...profile };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        addNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!'
        });
        setSuccessMessage('Your profile has been updated successfully.');
        setTimeout(() => setSuccessMessage(''), 5000);

        // Notify parent component about profile update
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
        }
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update profile'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Error',
        message: 'Passwords do not match'
      });
      return;
    }

    if (newPassword.length < 6) {
      addNotification({
        type: 'error',
        title: 'Password Error',
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: '', // Would need current password in real implementation
          new_password: newPassword
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Password Changed',
          message: 'Password changed successfully!'
        });
        setConfirmPasswordDialog(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Password Change Failed',
          message: error.message || 'Failed to change password'
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Resident Settings
      </Typography>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Section */}
        <Grid xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Profile Information
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profile.full_name}
                    onChange={handleProfileChange('full_name')}
                    error={errors.full_name ? true : false}
                    helperText={errors.full_name}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={user?.username || ''}
                    disabled
                    helperText="Username cannot be changed"
                    InputProps={{
                      startAdornment: <AccountCircle sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange('email')}
                    error={!!errors.email}
                    helperText={errors.email || 'Optional - Used for notifications and verification'}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={profile.contact_number}
                    onChange={handleProfileChange('contact_number')}
                    error={errors.contact_number ? true : false}
                    helperText={errors.contact_number || 'Optional - For emergency contact'}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  startIcon={<Save />}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Email Verification Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VerifiedUser sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Email Verification
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Verify your email address to ensure you receive important notifications and can access all resident features.
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Email sx={{ color: 'action.active' }} />
                <Typography variant="body1">
                  {profile.email || 'No email set'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={async () => {
                  if (!profile.email) {
                    addNotification({
                      type: 'error',
                      title: 'No Email',
                      message: 'Please set an email address first before verifying'
                    });
                    return;
                  }

                  setVerificationLoading(true);
                  try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify-email-for-residency`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    const data = await response.json();

                    if (response.ok) {
                      setVerificationStatus(data);

                      if (data.action === 'email_sent') {
                        addNotification({
                          type: 'success',
                          title: 'Verification Email Sent',
                          message: 'Please check your email inbox and spam folder, then click the verification link.'
                        });
                      }
                    } else {
                      addNotification({
                        type: 'error',
                        title: 'Verification Failed',
                        message: data.error || 'Failed to send verification email'
                      });
                    }
                  } catch (error) {
                    console.error('Email verification error:', error);
                    addNotification({
                      type: 'error',
                      title: 'Network Error',
                      message: 'Failed to send verification email. Please try again.'
                    });
                  } finally {
                    setVerificationLoading(false);
                  }
                }}
                disabled={verificationLoading || !profile.email}
                startIcon={verificationLoading ? null : <Send />}
                color="primary"
              >
                {verificationLoading ? 'Sending...' :
                 verificationStatus?.action === 'email_sent' ? 'Resend Verification Email' :
                 'Verify Email Address'}
              </Button>

              {verificationStatus?.action === 'email_sent' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  📧 Verification email sent! Check your inbox and click the verification link.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Security Settings
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Keep your account secure by regularly updating your password.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setConfirmPasswordDialog(true)}
                  startIcon={<Lock />}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Residency Verification Section - Only for residents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VerifiedUser sx={{ mr: 2, color: user?.residency_status === 'verified' ? 'success.main' : 'warning.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Residency Verification
                </Typography>
                {user?.residency_status === 'verified' && (
                  <CheckCircle sx={{ ml: 1, color: 'success.main' }} />
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {user?.residency_status === 'verified' ? (
                <Alert severity="success">
                  <Typography variant="body2">
                    ✅ Your residency has been verified! You can now request documents and certificates.
                  </Typography>
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Submit proof of residency to access document and certificate requests. Officers will review your submission.
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Accepted proof documents:</strong> Electric bills, water bills, barangay IDs, cedulas, property tax receipts, or other documents showing your barangay address.
                    </Typography>
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Proof Type"
                        value={residencyVerification.proof_type}
                        onChange={(e) => setResidencyVerification(prev => ({ ...prev, proof_type: e.target.value }))}
                        SelectProps={{ native: true }}
                        helperText="Select the type of document you're uploading"
                      >
                        <option value="">Select proof type</option>
                        <option value="electric_bill">Electric Bill</option>
                        <option value="water_bill">Water Bill</option>
                        <option value="cedula">Cedula</option>
                        <option value="barangay_id">Barangay ID</option>
                        <option value="property_tax">Property Tax Receipt</option>
                        <option value="other">Other Document</option>
                      </TextField>
                    </Grid>

                    <Grid xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<CloudUpload />}
                        sx={{ height: 56 }}
                      >
                        {residencyVerification.selectedFile ? residencyVerification.selectedFile.name : 'Upload Document'}
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setResidencyVerification(prev => ({ ...prev, selectedFile: file }));
                            }
                          }}
                        />
                      </Button>
                      {residencyVerification.selectedFile && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          File: {residencyVerification.selectedFile.name} ({(residencyVerification.selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </Typography>
                      )}
                    </Grid>

                    <Grid xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Notes (Optional)"
                        value={residencyVerification.notes}
                        onChange={(e) => setResidencyVerification(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional information about your residency or document"
                        helperText="Optional: Provide any additional context"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (!residencyVerification.proof_type || !residencyVerification.selectedFile) {
                          addNotification({
                            type: 'error',
                            title: 'Validation Error',
                            message: 'Please select proof type and upload a document'
                          });
                          return;
                        }

                        setResidencyVerification(prev => ({ ...prev, submitting: true }));

                        try {
                          // For residents, use Firebase token instead of JWT token
                          const token = user?.role === 'resident'
                            ? localStorage.getItem('residentAuthToken')
                            : localStorage.getItem('authToken');

                          if (!token) {
                            addNotification({
                              type: 'error',
                              title: 'Authentication Error',
                              message: 'Please log in again to submit verification'
                            });
                            return;
                          }

                          const formData = new FormData();
                          formData.append('proof_type', residencyVerification.proof_type);
                          formData.append('notes', residencyVerification.notes);
                          formData.append('proof_document', residencyVerification.selectedFile);

                          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/submit-residency-verification`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            },
                            body: formData
                          });

                          const data = await response.json();

                          if (response.ok) {
                            setResidencyVerification({
                              proof_type: '',
                              notes: '',
                              selectedFile: null,
                              submitting: false
                            });

                            addNotification({
                              type: 'success',
                              title: 'Verification Submitted',
                              message: 'Your residency verification request has been submitted. You will be notified once reviewed.'
                            });
                          } else {
                            addNotification({
                              type: 'error',
                              title: 'Submission Failed',
                              message: data.error || 'Failed to submit verification request'
                            });
                          }
                        } catch (error) {
                          console.error('Residency verification error:', error);
                          addNotification({
                            type: 'error',
                            title: 'Network Error',
                            message: 'Failed to submit verification request'
                          });
                        } finally {
                          setResidencyVerification(prev => ({ ...prev, submitting: false }));
                        }
                      }}
                      disabled={residencyVerification.submitting || !residencyVerification.proof_type || !residencyVerification.selectedFile}
                      startIcon={residencyVerification.submitting ? null : <Description />}
                      size="large"
                    >
                      {residencyVerification.submitting ? 'Submitting...' : 'Submit Verification'}
                    </Button>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      * Your request will be reviewed by barangay officers. Processing typically takes 2-3 business days.
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Summary Sidebar */}
        <Grid xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: user?.role_name === 'Super Admin' ? 'error.main' :
                           'primary.main',
                  fontSize: '2rem'
                }}
              >
                {getInitials(profile.full_name || user?.username || 'U')}
              </Avatar>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {profile.full_name || user?.username}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.role_name}
              </Typography>

              {profile.email && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📧 {profile.email}
                </Typography>
              )}

              {profile.contact_number && (
                <Typography variant="body2">
                  📱 {profile.contact_number}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Notifications sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Preferences
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={handlePreferenceChange('emailNotifications')}
                    />
                  }
                  label="Email notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.smsNotifications}
                      onChange={handlePreferenceChange('smsNotifications')}
                    />
                  }
                  label="SMS notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.darkMode}
                      onChange={handlePreferenceChange('darkMode')}
                    />
                  }
                  label="Dark mode"
                  disabled // Not implemented yet
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={confirmPasswordDialog} onClose={() => setConfirmPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter your new password. Make sure it's at least 6 characters long.
          </DialogContentText>

          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={newPassword && confirmPassword && newPassword !== confirmPassword}
            helperText={
              newPassword && confirmPassword && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleChangePassword}
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            variant="contained"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResidentSettings;
