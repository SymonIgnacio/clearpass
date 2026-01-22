import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Save, Upload, Download, Edit, Delete } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const SecretarySettings = () => {
  const [settings, setSettings] = useState({
    barangay_name: '',
    barangay_address: '',
    captain_name: '',
    secretary_name: '',
    contact_number: '',
    email: '',
    seal_image: null,
    letterhead_image: null,
    auto_approve_certificates: false,
    require_id_verification: true,
    notification_email: true,
    notification_sms: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sealDialogOpen, setSealDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiRequest('/system-admin/settings');
      const data = await response.json();
      setSettings(data.data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await apiRequest('/system-admin/settings', {
        method: 'PUT',
        body: settings,
      });
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Error saving settings: ' + error.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async type => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', type);

    try {
      const response = await apiRequest('/system-admin/upload-seal', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      setSettings(prev => ({
        ...prev,
        [type === 'seal' ? 'seal_image' : 'letterhead_image']: data.file_path,
      }));

      setMessage(`${type === 'seal' ? 'Seal' : 'Letterhead'} uploaded successfully!`);
      setSealDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      setMessage('Error uploading file: ' + error.message);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await apiRequest('/system-admin/export-settings');
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'barangay-settings.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Error exporting settings');
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await apiRequest('/system-admin/reset-settings', {
          method: 'POST',
        });
        fetchSettings();
        setMessage('Settings reset to defaults successfully!');
      } catch (error) {
        setMessage('Error resetting settings');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Administrative Settings
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Barangay Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Barangay Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Barangay Name'
                  value={settings.barangay_name}
                  onChange={e => handleInputChange('barangay_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Contact Number'
                  value={settings.contact_number}
                  onChange={e => handleInputChange('contact_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Barangay Address'
                  multiline
                  rows={2}
                  value={settings.barangay_address}
                  onChange={e => handleInputChange('barangay_address', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Barangay Captain Name'
                  value={settings.captain_name}
                  onChange={e => handleInputChange('captain_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Secretary Name'
                  value={settings.secretary_name}
                  onChange={e => handleInputChange('secretary_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Email Address'
                  type='email'
                  value={settings.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Document Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Document Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.auto_approve_certificates}
                    onChange={e => handleInputChange('auto_approve_certificates', e.target.checked)}
                  />
                }
                label='Auto-approve certificate requests'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.require_id_verification}
                    onChange={e => handleInputChange('require_id_verification', e.target.checked)}
                  />
                }
                label='Require ID verification for residents'
              />
            </Box>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Notification Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notification_email}
                    onChange={e => handleInputChange('notification_email', e.target.checked)}
                  />
                }
                label='Email notifications'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notification_sms}
                    onChange={e => handleInputChange('notification_sms', e.target.checked)}
                  />
                }
                label='SMS notifications'
              />
            </Box>
          </Paper>
        </Grid>

        {/* Seal and Letterhead Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Seal & Letterhead Management
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant='subtitle1' gutterBottom>
                      Official Seal
                    </Typography>
                    {settings.seal_image ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img
                          src={settings.seal_image}
                          alt='Official Seal'
                          style={{ maxWidth: '150px', maxHeight: '150px' }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', mb: 2 }}>
                        <Typography color='text.secondary'>No seal uploaded</Typography>
                      </Box>
                    )}
                    <Button
                      variant='outlined'
                      startIcon={<Upload />}
                      onClick={() => setSealDialogOpen(true)}
                      fullWidth
                    >
                      Upload New Seal
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant='subtitle1' gutterBottom>
                      Letterhead
                    </Typography>
                    {settings.letterhead_image ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img
                          src={settings.letterhead_image}
                          alt='Letterhead'
                          style={{ maxWidth: '200px', maxHeight: '100px' }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', mb: 2 }}>
                        <Typography color='text.secondary'>No letterhead uploaded</Typography>
                      </Box>
                    )}
                    <Button
                      variant='outlined'
                      startIcon={<Upload />}
                      onClick={() => setSealDialogOpen(true)}
                      fullWidth
                    >
                      Upload Letterhead
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='contained'
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant='outlined' startIcon={<Download />} onClick={exportSettings}>
                  Export Settings
                </Button>
              </Box>
              <Button variant='outlined' color='error' onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* File Upload Dialog */}
      <Dialog
        open={sealDialogOpen}
        onClose={() => setSealDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <input
            type='file'
            accept='image/*'
            onChange={e => setSelectedFile(e.target.files[0])}
            style={{ marginTop: '16px' }}
          />
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            Supported formats: PNG, JPG, JPEG. Maximum size: 2MB
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSealDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleFileUpload('seal')}
            variant='contained'
            disabled={!selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecretarySettings;
