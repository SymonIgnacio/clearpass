import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Add, Description, Info } from '@mui/icons-material';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/useAuth';

const ResidentCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    certificate_type_id: '',
    certificate_type: '',
    purpose: ''
  });

  const isGuest = user?.role === 13;

  useEffect(() => {
    fetchCertificates();
    fetchCertificateTypes();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateTypes = async () => {
    try {
      const response = await apiRequest('/certificate-types');
      if (response.ok) {
        const data = await response.json();
        setCertificateTypes(data);
      }
    } catch (error) {
      console.error('Error fetching certificate types:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await apiRequest('/certificates', {
        method: 'POST',
        body: {
            ...formData,
            resident_id: user.resident_id
        }
      });

      const data = await response.json();

      if (response.ok) {
        fetchCertificates();
        setOpen(false);
        setError('');
        setFormData({
            certificate_type_id: '',
            certificate_type: '',
            purpose: ''
        });
      } else {
        setError(data.error || 'Failed to request certificate');
      }
    } catch (error) {
      console.error('Error requesting certificate:', error);
      setError('Network error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Released': return 'info';
      case 'Pending': return 'warning';
      case 'Revoked': return 'error';
      default: return 'default';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Description sx={{ mr: 1 }} />
          My Certificates
        </Typography>
        
        {isGuest ? (
            <Tooltip title="Complete your residency verification to request certificates">
                <span>
                    <Button variant="contained" startIcon={<Add />} disabled>
                        Request Certificate
                    </Button>
                </span>
            </Tooltip>
        ) : (
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
                Request Certificate
            </Button>
        )}
      </Box>

      {isGuest && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
              You are currently logged in as a Guest. You can view this page, but you need to complete your residency verification before you can request certificates.
          </Alert>
      )}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell>Control #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Date Requested</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.length > 0 ? (
                certificates.map((cert) => (
                <TableRow key={cert.control_no || cert.id} hover>
                    <TableCell>{cert.control_no}</TableCell>
                    <TableCell>{cert.certificate_type}</TableCell>
                    <TableCell>{cert.purpose}</TableCell>
                    <TableCell>{new Date(cert.created_at || cert.date_issued).toLocaleDateString()}</TableCell>
                    <TableCell>
                    <Chip
                        label={cert.status}
                        color={getStatusColor(cert.status)}
                        size="small"
                        variant="outlined"
                    />
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No certificates found.
                        </Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request New Certificate</DialogTitle>
        <DialogContent sx={{ overflow: 'visible', pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Certificate Type</InputLabel>
              <Select
                value={formData.certificate_type_id}
                onChange={(e) => {
                  const selectedType = certificateTypes.find(type => type.id === e.target.value);
                  setFormData({
                    ...formData,
                    certificate_type_id: e.target.value,
                    certificate_type: selectedType ? selectedType.name : ''
                  });
                }}
                label="Certificate Type"
              >
                {certificateTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name} - ₱{type.fee}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="E.g., For Employment, School Requirement"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.certificate_type_id || !formData.purpose}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentCertificates;
