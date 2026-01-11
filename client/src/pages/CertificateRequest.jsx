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
  Grid
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const CertificateRequest = () => {
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCertificateTypes();
  }, []);

  const fetchCertificateTypes = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/certificate-requests/types');
      const data = await response.json();
      if (data.success) {
        setCertificateTypes(data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load certificate types' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType || !purpose.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await apiRequest('/certificate-requests/submit', {
        method: 'POST',
        body: {
          document_type: selectedType,
          purpose: purpose.trim()
        }
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate request submitted successfully!' });
        setSelectedType('');
        setPurpose('');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to submit request' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedCertificate = certificateTypes.find(type => type.name === selectedType);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Request Certificate
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Certificate Type</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    disabled={loading}
                  >
                    {certificateTypes.map((type) => (
                      <MenuItem key={type.id} value={type.name}>
                        {type.name} - ₱{type.fee}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedCertificate && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Certificate Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Description:</strong> {selectedCertificate.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>When Needed:</strong> {selectedCertificate.when_needed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fee:</strong> ₱{selectedCertificate.fee} | 
                      <strong> Valid for:</strong> {selectedCertificate.validity_days} days
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Please specify the purpose for this certificate..."
                  helperText="Clearly state why you need this certificate"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitLoading ? <CircularProgress size={20} /> : <SendIcon />}
                  disabled={submitLoading || loading}
                  fullWidth
                >
                  {submitLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CertificateRequest;