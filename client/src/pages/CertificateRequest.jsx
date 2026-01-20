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
  Paper,
  Divider
} from '@mui/material';
import { Send as SendIcon, UploadFile, Info } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const CertificateRequest = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [dynamicData, setDynamicData] = useState({});
  const [frontId, setFrontId] = useState(null);
  const [backId, setBackId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Standard purpose field if not in dynamic fields
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Use the new templates endpoint that returns merged template+type info
      const response = await apiRequest('/certificate-requests/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load certificate templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    setDynamicData({}); // Reset dynamic data
    setPurpose('');
  };

  const handleDynamicChange = (key, value) => {
    setDynamicData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    
    if (!selectedTemplate) return;

    // Validate standard fields
    if (!frontId || !backId) {
      setMessage({ type: 'error', text: 'Please upload both Front and Back ID photos' });
      return;
    }

    // Validate dynamic fields
    if (selectedTemplate.required_fields && selectedTemplate.required_fields.length > 0) {
       for (const field of selectedTemplate.required_fields) {
         if (field.required && !dynamicData[field.key]) {
           setMessage({ type: 'error', text: `Please fill in the ${field.label} field` });
           return;
         }
       }
    }

    // Validate purpose if it's not part of dynamic fields (legacy support)
    const purposeField = selectedTemplate.required_fields?.find(f => f.key === 'purpose');
    if (!purposeField && !purpose.trim()) {
        setMessage({ type: 'error', text: 'Please specify the purpose' });
        return;
    }

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', selectedTemplate.document_type);
      
      // If purpose is in dynamic data, use it. Otherwise use the standalone state.
      const finalPurpose = dynamicData['purpose'] || purpose;
      formData.append('purpose', finalPurpose);
      
      // Send all dynamic data as additional_data
      formData.append('additional_data', JSON.stringify(dynamicData));
      
      formData.append('front_id', frontId);
      formData.append('back_id', backId);

      const response = await apiRequest('/certificate-requests/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate request submitted successfully!' });
        setSelectedTemplateId('');
        setPurpose('');
        setDynamicData({});
        setFrontId(null);
        setBackId(null);
        // Scroll to top
        window.scrollTo(0, 0);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit request' });
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const hasPurposeField = selectedTemplate?.required_fields?.some(f => f.key === 'purpose');

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Request Certificate
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Select Certificate Type</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    disabled={loading}
                    label="Select Certificate Type"
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.display_name} {template.fee > 0 ? `- ₱${template.fee}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedTemplate && (
                <>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Certificate Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedTemplate.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body2">
                          <strong>Fee:</strong> ₱{selectedTemplate.fee}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Processing Time:</strong> 2-3 Days
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Dynamic Fields Section */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                      Required Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={2}>
                        {/* Auto-generated fields from Template Analysis */}
                        {selectedTemplate.required_fields && selectedTemplate.required_fields.map((field) => (
                            <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.key}>
                                <TextField
                                    fullWidth
                                    // Polish label: snake_case to Title Case
                                    label={field.label || field.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    required={field.required}
                                    multiline={field.type === 'textarea'}
                                    rows={field.type === 'textarea' ? 3 : 1}
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                    InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                                    value={dynamicData[field.key] || ''}
                                    onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                                />
                            </Grid>
                        ))}

                        {/* Fallback Purpose field if not defined in template */}
                        {!hasPurposeField && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    multiline
                                    rows={3}
                                    label="Purpose"
                                    placeholder="State your reason for requesting this document"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                />
                            </Grid>
                        )}
                    </Grid>
                  </Grid>

                  {/* ID Upload Section */}
                  <Grid item xs={12}>
                    <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Info fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        Valid ID Verification (Required)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Please upload clear photos of your valid ID (Front and Back) to verify your identity.
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant={frontId ? "contained" : "outlined"}
                            component="label"
                            fullWidth
                            startIcon={frontId ? <SendIcon /> : <UploadFile />}
                            color={frontId ? "success" : "primary"}
                            sx={{ height: 60 }}
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
                          {frontId && (
                              <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                                  {frontId.name}
                              </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            variant={backId ? "contained" : "outlined"}
                            component="label"
                            fullWidth
                            startIcon={backId ? <SendIcon /> : <UploadFile />}
                            color={backId ? "success" : "primary"}
                            sx={{ height: 60 }}
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
                          {backId && (
                              <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                                  {backId.name}
                              </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      disabled={submitLoading || loading || !frontId || !backId}
                      fullWidth
                      sx={{ 
                          py: 2, 
                          bgcolor: '#1DB954', 
                          '&:hover': { bgcolor: '#1ed760' },
                          fontSize: '1.1rem'
                      }}
                    >
                      {submitLoading ? 'Submitting Request...' : 'Submit Request'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CertificateRequest;
