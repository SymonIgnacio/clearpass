import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const ResidentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Middle_Name: '',
    Suffix: '',
    Mobile_Number: '',
    Occupation: '',
    Income_Estimate: '',
    Civil_Status: '',
    email: ''
  });
  const [beneficiaryData, setBeneficiaryData] = useState({
    Is_4Ps: false,
    Is_PWD: false,
    Is_Senior: false,
    Is_Solo_Parent: false,
    Is_Out_of_School_Youth: false,
    Disability_Type: ''
  });
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
    fetchVerificationStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiRequest('/resident-profile/profile');
      const data = await response.json();
      if (data.success) {
        const profileData = data.data;
        setProfile(profileData);
        setFormData({
          First_Name: profileData.First_Name || '',
          Last_Name: profileData.Last_Name || '',
          Middle_Name: profileData.Middle_Name || '',
          Suffix: profileData.Suffix || '',
          Mobile_Number: profileData.Mobile_Number || '',
          Occupation: profileData.Occupation || '',
          Income_Estimate: profileData.Income_Estimate || '',
          Civil_Status: profileData.Civil_Status || '',
          email: profileData.email || ''
        });
        setBeneficiaryData({
          Is_4Ps: profileData.Is_4Ps || false,
          Is_PWD: profileData.Is_PWD || false,
          Is_Senior: profileData.Is_Senior || false,
          Is_Solo_Parent: profileData.Is_Solo_Parent || false,
          Is_Out_of_School_Youth: profileData.Is_Out_of_School_Youth || false,
          Disability_Type: profileData.Disability_Type || ''
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await apiRequest('/resident-profile/verification-status');
      const data = await response.json();
      if (data.success) {
        setVerification(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch verification status');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBeneficiaryChange = (field, value) => {
    setBeneficiaryData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('/resident-profile/profile', {
        method: 'PUT',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBeneficiaryStatus = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('/resident-profile/beneficiary-status', {
        method: 'PUT',
        body: beneficiaryData
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Beneficiary status updated successfully. Vulnerability Score: ${data.vulnerability_score}` 
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update beneficiary status' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {profile?.First_Name?.charAt(0)}{profile?.Last_Name?.charAt(0)}
              </Avatar>
              <Typography variant="h6">
                {profile?.First_Name} {profile?.Last_Name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profile?.sitio_name} - {profile?.Household_Number}
              </Typography>
              <Chip 
                label={profile?.Residency_Status || 'Pending'}
                color={profile?.Residency_Status === 'Active' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              />
              
              {verification && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Verification Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip 
                      label="Email" 
                      color={verification.email_verified ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label="Phone" 
                      color={verification.phone_verified ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Personal Information</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.First_Name}
                    onChange={(e) => handleInputChange('First_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.Last_Name}
                    onChange={(e) => handleInputChange('Last_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    value={formData.Middle_Name}
                    onChange={(e) => handleInputChange('Middle_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Suffix"
                    value={formData.Suffix}
                    onChange={(e) => handleInputChange('Suffix', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={formData.Mobile_Number}
                    onChange={(e) => handleInputChange('Mobile_Number', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Civil Status</InputLabel>
                    <Select
                      value={formData.Civil_Status}
                      onChange={(e) => handleInputChange('Civil_Status', e.target.value)}
                    >
                      <MenuItem value="Single">Single</MenuItem>
                      <MenuItem value="Married">Married</MenuItem>
                      <MenuItem value="Widowed">Widowed</MenuItem>
                      <MenuItem value="Separated">Separated</MenuItem>
                      <MenuItem value="Divorced">Divorced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Occupation"
                    value={formData.Occupation}
                    onChange={(e) => handleInputChange('Occupation', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Estimated Monthly Income"
                    type="number"
                    value={formData.Income_Estimate}
                    onChange={(e) => handleInputChange('Income_Estimate', e.target.value)}
                    InputProps={{ startAdornment: '₱' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Beneficiary Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Beneficiary Status</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Update your beneficiary status to receive priority assistance and special services.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={beneficiaryData.Is_4Ps}
                        onChange={(e) => handleBeneficiaryChange('Is_4Ps', e.target.checked)}
                      />
                    }
                    label="4Ps Beneficiary (Pantawid Pamilyang Pilipino Program)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={beneficiaryData.Is_PWD}
                        onChange={(e) => handleBeneficiaryChange('Is_PWD', e.target.checked)}
                      />
                    }
                    label="Person with Disability (PWD)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={beneficiaryData.Is_Senior}
                        onChange={(e) => handleBeneficiaryChange('Is_Senior', e.target.checked)}
                      />
                    }
                    label="Senior Citizen (60 years old and above)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={beneficiaryData.Is_Solo_Parent}
                        onChange={(e) => handleBeneficiaryChange('Is_Solo_Parent', e.target.checked)}
                      />
                    }
                    label="Solo Parent"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={beneficiaryData.Is_Out_of_School_Youth}
                        onChange={(e) => handleBeneficiaryChange('Is_Out_of_School_Youth', e.target.checked)}
                      />
                    }
                    label="Out of School Youth"
                  />
                </Grid>
                {beneficiaryData.Is_PWD && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Disability Type"
                      value={beneficiaryData.Disability_Type}
                      onChange={(e) => handleBeneficiaryChange('Disability_Type', e.target.value)}
                      placeholder="Please specify your disability type"
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveBeneficiaryStatus}
                    disabled={saving}
                  >
                    Update Beneficiary Status
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResidentProfile;