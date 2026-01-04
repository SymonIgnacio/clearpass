import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, MenuItem, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const ResidentBlotterReport = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    incident_type: '',
    location: '',
    date_time: '',
    description: '',
    evidence: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const incidentTypes = [
    'Physical Injury',
    'Theft (Petty)',
    'Unjust Vexation',
    'Grave Threats',
    'Malicious Mischief',
    'Noise Barrage',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, evidence: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = new FormData();
      payload.append('incident_type', formData.incident_type);
      payload.append('location', formData.location);
      payload.append('date_time', formData.date_time);
      payload.append('description', formData.description);
      if (formData.evidence) {
        payload.append('evidence', formData.evidence);
      }

      await api.post('/blotter/file-online', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: 'Complaint filed successfully. Case is now under review.' });
      setFormData({ incident_type: '', location: '', date_time: '', description: '', evidence: null });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to file complaint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>File Blotter Report</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Submit your complaint online. Our officers will review and contact you.
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              select
              fullWidth
              label="Incident Type"
              name="incident_type"
              value={formData.incident_type}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            >
              {incidentTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Date and Time of Incident"
              name="date_time"
              type="datetime-local"
              value={formData.date_time}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
              sx={{ mb: 2 }}
            />

            <Button variant="outlined" component="label" sx={{ mb: 2 }}>
              Upload Evidence (Optional)
              <input type="file" hidden onChange={handleFileChange} accept="image/*,.pdf" />
            </Button>
            {formData.evidence && (
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                {formData.evidence.name}
              </Typography>
            )}

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResidentBlotterReport;
