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
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Description,
  Visibility,
  CheckCircle,
  Cancel,
  Assignment,
  Download,
} from '@mui/icons-material';
import { apiRequest } from '../../utils/api';
import { useNotifications } from '../../contexts/NotificationContext';

const ResidencyVerification = () => {
  const { notify } = useNotifications();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [filterStatus]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`secretary/resident-documents?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      notify('Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId, status, notes = '') => {
    setActionLoading(true);
    try {
      const response = await apiRequest(`secretary/documents/${docId}/verify`, {
        method: 'POST',
        body: {
          status,
          notes,
          source_type: selectedDoc?.source_type,
        },
      });

      if (response.ok) {
        notify(`Document ${status} successfully`, 'success');
        setVerificationModalOpen(false);
        setRejectReason('');
        fetchDocuments();
      } else {
        const data = await response.json();
        notify(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      notify('An error occurred during verification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openFile = async (docId, fileName) => {
    try {
      const doc = documents.find(d => d.id === docId) || selectedDoc;
      const sourceType = doc?.source_type || 'resident';

      const response = await apiRequest(
        `secretary/documents/${docId}/download?source_type=${sourceType}`
      );
      if (!response.ok) {
        notify('Failed to download document', 'error');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error opening file:', error);
      notify('Error opening file', 'error');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'verified':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Description sx={{ mr: 1 }} />
        Residency Verification
      </Typography>
      <Typography variant='subtitle1' color='textSecondary' sx={{ mb: 3 }}>
        Review and verify uploaded proof of residency documents.
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h6'>Uploaded Documents</Typography>
        <ToggleButtonGroup
          value={filterStatus}
          exclusive
          onChange={(e, newStatus) => {
            if (newStatus !== null) setFilterStatus(newStatus);
          }}
          size='small'
        >
          <ToggleButton value='pending'>Pending</ToggleButton>
          <ToggleButton value='verified'>Verified</ToggleButton>
          <ToggleButton value='rejected'>Rejected</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Resident Name</TableCell>
              <TableCell>Document Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Date Uploaded</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length > 0 ? (
              documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.resident_name || 'Unknown'}</TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>{doc.file_name}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.verification_status}
                      color={getStatusColor(doc.verification_status)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='View Document'>
                      <IconButton onClick={() => openFile(doc.id, doc.file_name)} size='small'>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {filterStatus === 'pending' && (
                      <Tooltip title='Verify/Reject'>
                        <IconButton
                          color='primary'
                          onClick={() => {
                            setSelectedDoc(doc);
                            setVerificationModalOpen(true);
                          }}
                          size='small'
                        >
                          <Assignment />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 3 }}>
                  No documents found with status "{filterStatus}".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Verification Dialog */}
      <Dialog
        open={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Verify Document</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box sx={{ pt: 1 }}>
              <Alert severity='info' sx={{ mb: 2 }}>
                Reviewing: <strong>{selectedDoc.file_name}</strong> by {selectedDoc.resident_name}
              </Alert>

              <Button
                variant='outlined'
                startIcon={<Download />}
                onClick={() => openFile(selectedDoc.id, selectedDoc.file_name)}
                sx={{ mb: 2 }}
                fullWidth
              >
                Preview Document
              </Button>

              <TextField
                label='Rejection Notes (if rejecting)'
                multiline
                rows={3}
                fullWidth
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder='Reason for rejection...'
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationModalOpen(false)}>Cancel</Button>
          <Button
            color='error'
            onClick={() => handleVerify(selectedDoc.id, 'rejected', rejectReason)}
            disabled={actionLoading || !rejectReason}
            startIcon={<Cancel />}
          >
            Reject
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={() => handleVerify(selectedDoc.id, 'verified')}
            disabled={actionLoading}
            startIcon={<CheckCircle />}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidencyVerification;
