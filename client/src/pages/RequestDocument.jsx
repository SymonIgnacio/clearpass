import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Description,
  Send,
  Warning,
  CheckCircle,
  Error,
  Info,
  Assignment,
  Person,
  LocationOn,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

// Color palette for UI
const COLORS = ['#1DB954', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const RequestDocument = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [residents, setResidents] = useState([]);
  const [userRequests, setUserRequests] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    resident_id: '',
    document_type: '',
    purpose: '',
    request_data: {}
  });

  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load document types
      const typesRes = await apiRequest('documents/types');
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setDocumentTypes(typesData.data || []);
      }

      // Load user's resident records (if they have any)
      const residentsRes = await apiRequest('residents?limit=100');
      if (residentsRes.ok) {
        const residentsData = await residentsRes.json();
        setResidents(residentsData.data || []);
      }

      // Load user's previous requests
      await loadUserRequests();

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRequests = async () => {
    try {
      const requestsRes = await apiRequest('documents/requests');
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setUserRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.resident_id || !formData.document_type) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const requestPayload = {
        resident_id: formData.resident_id,
        document_type: formData.document_type,
        request_data: {
          purpose: formData.purpose,
          ...formData.request_data
        }
      };

      const response = await apiRequest('documents/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Document request submitted successfully!');
        setShowConfirmDialog(false);
        resetForm();
        loadUserRequests(); // Refresh requests list
      } else {
        alert(`Error: ${data.message || 'Failed to submit request'}`);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      resident_id: '',
      document_type: '',
      purpose: '',
      request_data: {}
    });
  };

  const handleDocumentTypeChange = (documentType) => {
    setFormData(prev => ({
      ...prev,
      document_type: documentType,
      request_data: {} // Reset request data when type changes
    }));
  };

  const getDocumentTypeInfo = (typeId) => {
    return documentTypes.find(type => type.id === typeId) || {};
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // CRITICAL: Verification Gate Check
  const isVerified = user?.account_status === 'Verified';
  const isUnverified = user?.account_status === 'Unverified' || user?.account_status === 'Account Created';

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Document Request...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              background: 'linear-gradient(45deg, #1DB954, #4ECDC4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
            Document Request
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Request official barangay documents and certificates
          </Typography>
        </Box>
      </Box>

      {/* CRITICAL: Verification Gate - Block unverified users */}
      {isUnverified && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
            Account Not Verified
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your account status is "{user?.account_status}". You must verify your identity before requesting documents.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>What you need to do:</strong>
            <br />
            1. Upload a valid government-issued ID (e.g., Driver's License, Passport, or National ID)
            <br />
            2. Submit proof of residency
            <br />
            3. Wait for approval from barangay officials
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/settings'}
            sx={{ backgroundColor: '#1DB954' }}
          >
            Go to Settings to Upload ID
          </Button>
        </Alert>
      )}

      {/* Show request form only for verified users */}
      {isVerified && (
        <>
          {/* Request Form */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                New Document Request
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Resident</InputLabel>
                    <Select
                      value={formData.resident_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, resident_id: e.target.value }))}
                      label="Select Resident"
                    >
                      {residents.map((resident) => (
                        <MenuItem key={resident.Resident_ID} value={resident.Resident_ID}>
                          {`${resident.First_Name} ${resident.Last_Name}`} - {resident.Resident_ID}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={formData.document_type}
                      onChange={(e) => handleDocumentTypeChange(e.target.value)}
                      label="Document Type"
                    >
                      {documentTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {formData.document_type && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>{getDocumentTypeInfo(formData.document_type).name}</strong>
                        <br />
                        {getDocumentTypeInfo(formData.document_type).description}
                        <br />
                        <strong>Processing Time:</strong> {getDocumentTypeInfo(formData.document_type).estimated_time}
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Purpose of Request"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="Please specify why you need this document..."
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!formData.resident_id || !formData.document_type || !formData.purpose.trim()}
                    sx={{
                      backgroundColor: '#1DB954',
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    <Send sx={{ mr: 1 }} />
                    Submit Document Request
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* User's Previous Requests */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Document Requests
              </Typography>

              {userRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No document requests yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your submitted document requests will appear here
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {userRequests.map((request) => (
                    <Grid item xs={12} md={6} key={request.request_id}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {getDocumentTypeInfo(request.document_type).name || request.document_type}
                          </Typography>
                          <Chip
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Request ID:</strong> {request.request_id}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Estimated Time:</strong> {request.document_type_info?.estimated_time || 'TBD'}
                        </Typography>

                        {request.status === 'completed' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.open(`/api/documents/requests/${request.request_id}/download`, '_blank')}
                            sx={{ borderColor: '#1DB954', color: '#1DB954' }}
                          >
                            Download Document
                          </Button>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="md">
        <DialogTitle>
          Confirm Document Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Please review your request details:
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Resident:</strong> {
                    residents.find(r => r.Resident_ID === formData.resident_id)
                      ? `${residents.find(r => r.Resident_ID === formData.resident_id).First_Name} ${residents.find(r => r.Resident_ID === formData.resident_id).Last_Name}`
                      : 'Unknown'
                  }
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Document Type:</strong> {getDocumentTypeInfo(formData.document_type).name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Purpose:</strong> {formData.purpose}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Estimated Processing Time:</strong> {getDocumentTypeInfo(formData.document_type).estimated_time}
                </Typography>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                Once submitted, your request will be reviewed by barangay officials. You will be notified via email/SMS when your document is ready for pickup or download.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ backgroundColor: '#1DB954' }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestDocument;
