import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Autocomplete } from '@mui/material';
import { useAuth } from '../contexts/useAuth';
import { apiRequest } from '../utils/api';

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

  // Common keywords for suggestions (matches AI service mapping)
  const incidentSuggestions = [
    "Physical Injury", "Binugbog (Beaten)", "Suntukan (Fistfight)", "Sinaktan (Hurt)",
    "Theft", "Ninakawan (Robbed)", "Nawala (Lost Item)", "Snatcher", "Holdup",
    "Noise Complaint", "Maingay (Noisy)", "Videoke", "Nagkakantahan",
    "Grave Threats", "Banta (Threat)", "Tinatakot (Threatening)", "Papatayin",
    "Vandalism", "Sira (Damaged)", "Binasag",
    "Drug Related", "Adik (Addict)", "Droga",
    "Sexual Harassment", "Bastos (Rude/Lewd)", "Hinipo",
    "Dispute", "Nag-aaway (Fighting)", "Away Kapitbahay (Neighbor Dispute)"
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
      const response = await apiRequest('/blotter-complaints/submit', {
        method: 'POST',
        body: {
          incident_type: formData.incident_type,
          location: formData.location,
          date_time: formData.date_time,
          description: formData.description
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Complaint filed successfully. Case is now under review.' });
        setFormData({ incident_type: '', location: '', date_time: '', description: '', evidence: null });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to file complaint' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to file complaint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
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
            <Autocomplete
              freeSolo
              options={incidentSuggestions}
              value={formData.incident_type}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, incident_type: newValue || '' }));
              }}
              onInputChange={(event, newInputValue) => {
                setFormData(prev => ({ ...prev, incident_type: newInputValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Nature of Incident (e.g., Noise Complaint, Theft, Maingay)"
                  name="incident_type"
                  required
                  sx={{ mb: 2 }}
                />
              )}
            />

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
