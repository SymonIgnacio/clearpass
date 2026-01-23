import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  CloudUpload,
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';
import logger from '../utils/logger';
import { validateBeneficiaryFile } from '../utils/fileValidation';

const ResidentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [blotterHistory, setBlotterHistory] = useState([]);
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Middle_Name: '',
    Suffix: '',
    Occupation: '',
    Income_Estimate: '',
    Civil_Status: '',
    email: '',
  });
  const [beneficiaryData, setBeneficiaryData] = useState({
    Is_4Ps: false,
    Is_PWD: false,
    Is_Senior: false,
    Is_Solo_Parent: false,
    Is_Out_of_School_Youth: false,
    Disability_Type: '',
  });
  const [validationStatus, setValidationStatus] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const submitLock = useRef(false);

  useEffect(() => {
    fetchProfile();
    fetchVerificationStatus();
  }, []);

  useEffect(() => {
    if (profile?.Resident_ID) {
      fetchBlotterHistory(profile.Resident_ID);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await apiRequest('/resident-profile/profile');
      if (!response.ok) {
        setMessage({ type: 'error', text: 'Unable to load profile (network)' });
        return;
      }
      const data = await response.json();
      if (!data?.success || !data?.data) {
        setMessage({ type: 'error', text: 'Unable to load profile (server)' });
        return;
      }
      const profileData = data.data;
      setProfile(profileData || {});
      setFormData({
        First_Name: profileData?.First_Name || '',
        Last_Name: profileData?.Last_Name || '',
        Middle_Name: profileData?.Middle_Name || '',
        Suffix: profileData?.Suffix || '',
        Occupation: profileData?.Occupation || '',
        Income_Estimate: profileData?.Income_Estimate || '',
        Civil_Status: profileData?.Civil_Status || '',
        email: profileData?.email || '',
      });
      setBeneficiaryData({
        Is_4Ps: profileData?.Is_4Ps || false,
        Is_PWD: profileData?.Is_PWD || false,
        Is_Senior: profileData?.Is_Senior || false,
        Is_Solo_Parent: profileData?.Is_Solo_Parent || false,
        Is_Out_of_School_Youth: profileData?.Is_Out_of_School_Youth || false,
        Disability_Type: profileData?.Disability_Type || '',
      });
      setValidationStatus(profileData?.validation_status || null);
    } catch (error) {
      logger.error('Failed to load profile', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await apiRequest('/resident-profile/verification-status');
      if (!response.ok) return;
      const data = await response.json();
      if (data?.success) setVerification(data.data || null);
    } catch (error) {
      logger.warn('Failed to fetch verification status', error);
    }
  };

  const fetchBlotterHistory = async residentId => {
    try {
      const response = await apiRequest(`/residents/${residentId}/blotter-history`);
      if (!response.ok) return;
      const data = await response.json();
      setBlotterHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.warn('Failed to fetch blotter history', error);
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
        body: formData,
      });
      if (!response.ok) {
        setMessage({ type: 'error', text: 'Update failed (network)' });
      } else {
        const data = await response.json();
        if (data?.success) {
          setMessage({ type: 'success', text: 'Profile updated successfully' });
        } else {
          setMessage({ type: 'error', text: data?.message || 'Update failed (server)' });
        }
      }
    } catch (error) {
      logger.error('Failed to update profile', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  };

  const [beneficiaryFiles, setBeneficiaryFiles] = useState({});

  const handleBeneficiaryFileChange = (field, file, side = null) => {
    const check = validateBeneficiaryFile(file);
    if (!check.valid) {
      setMessage({ type: 'error', text: check.reason });
      return;
    }
    if (side) {
      // For Front/Back files
      setBeneficiaryFiles(prev => ({
        ...prev,
        [`${field}_${side}`]: file,
      }));
    } else {
      // For single files
      setBeneficiaryFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSaveBeneficiaryStatus = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSaving(true);
    try {
      const formData = new FormData();

      // Append status data
      Object.keys(beneficiaryData).forEach(key => {
        formData.append(key, beneficiaryData[key]);
      });

      // Validate required proofs per selection
      // Only validate if the field is NOT locked (meaning it's a new or editable claim)
      if (beneficiaryData.Is_4Ps && !isLocked('Is_4Ps') && !beneficiaryFiles.Is_4Ps_File) {
        setMessage({ type: 'error', text: '4Ps ID proof is required' });
        return;
      }
      if (
        beneficiaryData.Is_PWD &&
        !isLocked('Is_PWD') &&
        (!beneficiaryFiles.Is_PWD_File_Front || !beneficiaryFiles.Is_PWD_File_Back)
      ) {
        setMessage({ type: 'error', text: 'PWD ID front and back are required' });
        return;
      }
      if (beneficiaryData.Is_PWD && !isLocked('Is_PWD') && !beneficiaryData.Disability_Type) {
        setMessage({ type: 'error', text: 'Please specify Disability Type' });
        return;
      }
      if (
        beneficiaryData.Is_Senior &&
        !isLocked('Is_Senior') &&
        (!beneficiaryFiles.Is_Senior_File_Front || !beneficiaryFiles.Is_Senior_File_Back)
      ) {
        setMessage({ type: 'error', text: 'Senior ID front and back are required' });
        return;
      }
      if (
        beneficiaryData.Is_Solo_Parent &&
        !isLocked('Is_Solo_Parent') &&
        (!beneficiaryFiles.Is_Solo_Parent_File_Front || !beneficiaryFiles.Is_Solo_Parent_File_Back)
      ) {
        setMessage({ type: 'error', text: 'Solo Parent ID front and back are required' });
        return;
      }
      if (
        beneficiaryData.Is_Out_of_School_Youth &&
        !isLocked('Is_Out_of_School_Youth') &&
        !beneficiaryFiles.Is_Out_of_School_Youth_File
      ) {
        setMessage({ type: 'error', text: 'Out of School Youth certification is required' });
        return;
      }

      // Append files
      Object.keys(beneficiaryFiles).forEach(key => {
        if (beneficiaryFiles[key]) {
          // If the key already has _Front or _Back, use it as is
          // Otherwise append _File for legacy/single file support if needed,
          // but our logic below will use specific keys like Is_PWD_File_Front
          // Actually, let's just append the key as is, because we will name them correctly in state
          formData.append(key, beneficiaryFiles[key]);
        }
      });

      const response = await apiRequest('/resident-profile/beneficiary-status', {
        method: 'PUT',
        body: formData,
        // Don't set Content-Type header manually for FormData, let browser set it with boundary
        headers: {},
      });

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Submission failed (network)' });
      } else {
        const data = await response.json();
        if (data?.success) {
          setMessage({
            type: 'success',
            text: `Request submitted for acknowledgement. Vulnerability Score: ${data.vulnerability_score}`,
          });
          fetchProfile();
        } else {
          setMessage({ type: 'error', text: data?.message || 'Submission failed (server)' });
        }
      }
    } catch (error) {
      logger.error('Beneficiary update error', error);
      setMessage({ type: 'error', text: 'Failed to submit request' });
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  };

  const isLocked = field => {
    // Lock only if the field was originally true in the fetched profile (previously submitted)
    // AND validation status is pending or approved
    const isOriginallySubmitted = !!(profile && profile[field]);
    return (
      isOriginallySubmitted && (validationStatus === 'pending' || validationStatus === 'approved')
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      <Typography variant='h4' gutterBottom>
        My Profile
      </Typography>

      {!profile?.Resident_ID && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Access restricted. Complete resident verification to view full profile.
        </Alert>
      )}

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {profile?.First_Name?.charAt(0)}
                {profile?.Last_Name?.charAt(0)}
              </Avatar>
              <Typography variant='h6'>
                {profile?.First_Name} {profile?.Last_Name}
              </Typography>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                {profile?.sitio_name} - {profile?.Household_Number}
              </Typography>
              <Chip
                label={profile?.Residency_Status || 'Pending'}
                color={profile?.Residency_Status === 'Active' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              />

              {verification && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Verification Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label='Email'
                      color={verification.email_verified ? 'success' : 'default'}
                      size='small'
                    />
                    <Chip
                      label='Phone'
                      color={verification.phone_verified ? 'success' : 'default'}
                      size='small'
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
                <Typography variant='h6'>Personal Information</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='First Name'
                    value={formData.First_Name}
                    onChange={e => handleInputChange('First_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Last Name'
                    value={formData.Last_Name}
                    onChange={e => handleInputChange('Last_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Middle Name'
                    value={formData.Middle_Name}
                    onChange={e => handleInputChange('Middle_Name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Suffix'
                    value={formData.Suffix}
                    onChange={e => handleInputChange('Suffix', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Email'
                    type='email'
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Civil Status</InputLabel>
                    <Select
                      value={formData.Civil_Status}
                      onChange={e => handleInputChange('Civil_Status', e.target.value)}
                    >
                      <MenuItem value='Single'>Single</MenuItem>
                      <MenuItem value='Married'>Married</MenuItem>
                      <MenuItem value='Widowed'>Widowed</MenuItem>
                      <MenuItem value='Separated'>Separated</MenuItem>
                      <MenuItem value='Divorced'>Divorced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Occupation'
                    value={formData.Occupation}
                    onChange={e => handleInputChange('Occupation', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Estimated Monthly Income'
                    type='number'
                    value={formData.Income_Estimate}
                    onChange={e => handleInputChange('Income_Estimate', e.target.value)}
                    InputProps={{ startAdornment: '₱' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant='contained'
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
                <Typography variant='h6'>Beneficiary Status</Typography>
              </Box>

              <Alert severity='info' sx={{ mb: 3 }}>
                Request for acknowledgement of your beneficiary status to receive priority
                assistance. Proof of document is required for each claim.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!beneficiaryData.Is_4Ps}
                          onChange={e => handleBeneficiaryChange('Is_4Ps', e.target.checked)}
                          disabled={isLocked('Is_4Ps')}
                        />
                      }
                      label='4Ps Beneficiary'
                    />
                    {beneficiaryData.Is_4Ps && !isLocked('Is_4Ps') && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          component='label'
                          variant='outlined'
                          startIcon={<CloudUpload />}
                          fullWidth
                          size='small'
                        >
                          Upload 4Ps ID
                          <input
                            type='file'
                            hidden
                            accept='image/*,.pdf'
                            onChange={e =>
                              handleBeneficiaryFileChange('Is_4Ps_File', e.target.files[0])
                            }
                          />
                        </Button>
                        {beneficiaryFiles.Is_4Ps_File && (
                          <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                            Selected: {beneficiaryFiles.Is_4Ps_File.name}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!beneficiaryData.Is_PWD}
                          onChange={e => handleBeneficiaryChange('Is_PWD', e.target.checked)}
                          disabled={isLocked('Is_PWD')}
                        />
                      }
                      label='Person with Disability (PWD)'
                    />
                    {beneficiaryData.Is_PWD && !isLocked('Is_PWD') && (
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Front ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_PWD_File',
                                  e.target.files[0],
                                  'Front'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_PWD_File_Front && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Front: {beneficiaryFiles.Is_PWD_File_Front.name}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Back ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_PWD_File',
                                  e.target.files[0],
                                  'Back'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_PWD_File_Back && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Back: {beneficiaryFiles.Is_PWD_File_Back.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!beneficiaryData.Is_Senior}
                          onChange={e => handleBeneficiaryChange('Is_Senior', e.target.checked)}
                          disabled={isLocked('Is_Senior')}
                        />
                      }
                      label='Senior Citizen'
                    />
                    {beneficiaryData.Is_Senior && !isLocked('Is_Senior') && (
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Front ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_Senior_File',
                                  e.target.files[0],
                                  'Front'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_Senior_File_Front && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Front: {beneficiaryFiles.Is_Senior_File_Front.name}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Back ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_Senior_File',
                                  e.target.files[0],
                                  'Back'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_Senior_File_Back && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Back: {beneficiaryFiles.Is_Senior_File_Back.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!beneficiaryData.Is_Solo_Parent}
                          onChange={e =>
                            handleBeneficiaryChange('Is_Solo_Parent', e.target.checked)
                          }
                          disabled={isLocked('Is_Solo_Parent')}
                        />
                      }
                      label='Solo Parent'
                    />
                    {beneficiaryData.Is_Solo_Parent && !isLocked('Is_Solo_Parent') && (
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Front ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_Solo_Parent_File',
                                  e.target.files[0],
                                  'Front'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_Solo_Parent_File_Front && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Front: {beneficiaryFiles.Is_Solo_Parent_File_Front.name}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Back ID
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_Solo_Parent_File',
                                  e.target.files[0],
                                  'Back'
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_Solo_Parent_File_Back && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Back: {beneficiaryFiles.Is_Solo_Parent_File_Back.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!beneficiaryData.Is_Out_of_School_Youth}
                          onChange={e =>
                            handleBeneficiaryChange('Is_Out_of_School_Youth', e.target.checked)
                          }
                          disabled={isLocked('Is_Out_of_School_Youth')}
                        />
                      }
                      label='Out of School Youth'
                    />
                    {beneficiaryData.Is_Out_of_School_Youth &&
                      !isLocked('Is_Out_of_School_Youth') && (
                        <Box sx={{ mt: 1 }}>
                          <Button
                            component='label'
                            variant='outlined'
                            startIcon={<CloudUpload />}
                            fullWidth
                            size='small'
                          >
                            Upload Certification
                            <input
                              type='file'
                              hidden
                              accept='image/*,.pdf'
                              onChange={e =>
                                handleBeneficiaryFileChange(
                                  'Is_Out_of_School_Youth_File',
                                  e.target.files[0]
                                )
                              }
                            />
                          </Button>
                          {beneficiaryFiles.Is_Out_of_School_Youth_File && (
                            <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                              Selected: {beneficiaryFiles.Is_Out_of_School_Youth_File.name}
                            </Typography>
                          )}
                        </Box>
                      )}
                  </Box>
                </Grid>
                {beneficiaryData.Is_PWD && !isLocked('Is_PWD') && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Disability Type'
                      value={beneficiaryData.Disability_Type}
                      onChange={e => handleBeneficiaryChange('Disability_Type', e.target.value)}
                      placeholder='Please specify your disability type'
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    variant='contained'
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveBeneficiaryStatus}
                    disabled={saving}
                  >
                    Request for Acknowledgement
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Blotter History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <GavelIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant='h6'>Blotter History</Typography>
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Case #</TableCell>
                      <TableCell>Incident Type</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {blotterHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align='center'>
                          No blotter records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      blotterHistory.map(record => (
                        <TableRow key={record.Case_Number}>
                          <TableCell>{record.Case_Number}</TableCell>
                          <TableCell>{record.Incident_Type}</TableCell>
                          <TableCell>
                            {record.complainant_resident_id === profile.Resident_ID ? (
                              <Chip
                                label='Complainant'
                                size='small'
                                color='primary'
                                variant='outlined'
                              />
                            ) : (
                              <Chip
                                label='Respondent'
                                size='small'
                                color='error'
                                variant='outlined'
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.Status}
                              size='small'
                              color={record.Status === 'Pending' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(record.DateTime_Incident).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResidentProfile;
