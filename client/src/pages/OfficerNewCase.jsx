import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const OfficerNewCase = () => {
  const [formData, setFormData] = useState({
    incident_type: '',
    description: '',
    location: '',
    incident_date: '',
    status: 'pending',
    complainant: { name: '', contact: '', address: '' },
    respondent: { name: '', contact: '', address: '' },
    witnesses: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const incidentTypes = [
    'Noise Complaint',
    'Property Dispute',
    'Domestic Violence',
    'Theft',
    'Assault',
    'Vandalism',
    'Public Disturbance',
    'Other',
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: '', contact: '' }],
    }));
  };

  const removeWitness = index => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index),
    }));
  };

  const updateWitness = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map((witness, i) =>
        i === index ? { ...witness, [field]: value } : witness
      ),
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest('/case-management/create', {
        method: 'POST',
        body: {
          incident_type: formData.incident_type,
          description: formData.description,
          location: formData.location,
          incident_date: formData.incident_date,
          complainant: formData.complainant,
          respondent: formData.respondent,
          witnesses: formData.witnesses,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(
          `Error creating case: ${data?.message || data?.error || `HTTP ${response.status}`}`
        );
        return;
      }

      setMessage(`Case created successfully! Case #: ${data?.case_id || 'N/A'}`);
      setFormData({
        incident_type: '',
        description: '',
        location: '',
        incident_date: '',
        status: 'pending',
        complainant: { name: '', contact: '', address: '' },
        respondent: { name: '', contact: '', address: '' },
        witnesses: [],
      });
    } catch (error) {
      setMessage(`Error creating case: ${error?.message || 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        New Case Encoding
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Incident Type</InputLabel>
                <Select
                  value={formData.incident_type}
                  onChange={e => handleInputChange('incident_type', e.target.value)}
                  required
                >
                  {incidentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Location'
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='datetime-local'
                label='Incident Date & Time'
                value={formData.incident_date}
                onChange={e => handleInputChange('incident_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Description'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Complainant Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Complainant Name'
                value={formData.complainant.name}
                onChange={e => handleInputChange('complainant.name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Contact'
                value={formData.complainant.contact}
                onChange={e => handleInputChange('complainant.contact', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Address'
                value={formData.complainant.address}
                onChange={e => handleInputChange('complainant.address', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Respondent Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Respondent Name'
                value={formData.respondent.name}
                onChange={e => handleInputChange('respondent.name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Contact'
                value={formData.respondent.contact}
                onChange={e => handleInputChange('respondent.contact', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Address'
                value={formData.respondent.address}
                onChange={e => handleInputChange('respondent.address', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant='h6'>Witnesses</Typography>
                <Button startIcon={<Add />} onClick={addWitness} size='small'>
                  Add Witness
                </Button>
              </Box>

              {formData.witnesses.map((witness, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label='Witness Name'
                    value={witness.name}
                    onChange={e => updateWitness(index, 'name', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label='Contact'
                    value={witness.contact}
                    onChange={e => updateWitness(index, 'contact', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeWitness(index)} color='error'>
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Button
                type='submit'
                variant='contained'
                size='large'
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? 'Creating Case...' : 'Create Case'}
              </Button>
              <Button variant='outlined' size='large'>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default OfficerNewCase;
