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
  const [frontId, setFrontId] = useState(null);
  const [backId, setBackId] = useState(null);
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
    if (!selectedType || !purpose.trim() || !frontId || !backId) {
      setMessage({ type: 'error', text: 'Please fill in all required fields and upload both ID photos' });
      return;
    }

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', selectedType);
      formData.append('purpose', purpose.trim());
      formData.append('front_id', frontId);
      formData.append('back_id', backId);

      const response = await apiRequest('/certificate-requests/submit', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually for FormData, let browser set it with boundary
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate request submitted successfully!' });
        setSelectedType('');
        setPurpose('');
        setFrontId(null);
        setBackId(null);
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
                    label="Certificate Type"
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
                    {selectedCertificate.required_data && (
                       <Box sx={{ mt: 2 }}>
                         <Typography variant="subtitle2" color="primary">Required Documents:</Typography>
                         <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                           {JSON.parse(selectedCertificate.required_data).map((req, index) => (
                             <li key={index}>
                               <Typography variant="body2">{req}</Typography>
                             </li>
                           ))}
                         </ul>
                       </Box>
                    )}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom required>
                    Upload Valid ID (Required)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Please upload clear photos of your valid ID (Front and Back). Accepted formats: JPG, PNG.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        color={frontId ? "success" : "primary"}
                      >
                        {frontId ? "Front ID Selected" : "Upload Front ID"}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setFrontId(e.target.files[0])}
                          required
                        />
                      </Button>
                      {frontId && <Typography variant="caption" display="block" sx={{ mt: 1 }}>{frontId.name}</Typography>}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        color={backId ? "success" : "primary"}
                      >
                        {backId ? "Back ID Selected" : "Upload Back ID"}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setBackId(e.target.files[0])}
                          required
                        />
                      </Button>
                      {backId && <Typography variant="caption" display="block" sx={{ mt: 1 }}>{backId.name}</Typography>}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

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
                  disabled={submitLoading || loading || !frontId || !backId}
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