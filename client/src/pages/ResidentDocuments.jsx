import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import {
  Description,
  CloudDownload,
  Visibility,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  FolderShared,
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/useAuth';

const ResidentDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const isGuest = user?.role === 13;

  useEffect(() => {
    if (!isGuest) {
      fetchDocuments();
    } else {
      setLoading(false);
      setError('Complete your residency verification to view your documents.');
    }
  }, [isGuest]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/residents/${user.resident_id}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      setError('Could not load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = status => {
    const statusMap = {
      verified: { color: 'success', icon: <CheckCircle />, label: 'Verified' },
      approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
      pending: { color: 'warning', icon: <Pending />, label: 'Pending Review' },
      rejected: { color: 'error', icon: <ErrorIcon />, label: 'Rejected' },
    };

    const config = statusMap[status?.toLowerCase()] || statusMap.pending;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size='small'
        variant='outlined'
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleOpenDetails = doc => {
    setSelectedDocument(doc);
  };

  const handleCloseDetails = () => {
    setSelectedDocument(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
            <FolderShared />
          </Avatar>
          <Box>
            <Typography variant='h5' fontWeight='600'>
              My Documents
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              Track the status of your submitted documents and proofs.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell>Document Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Date Uploaded</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length > 0 ? (
              documents.map(doc => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description color='action' sx={{ mr: 1.5 }} />
                      <Typography variant='body2' fontWeight='500'>
                        {doc.document_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{doc.file_name}</TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{getStatusChip(doc.verification_status)}</TableCell>
                  <TableCell align='center'>
                    <Tooltip title='View Details'>
                      <IconButton
                        size='small'
                        color='primary'
                        onClick={() => handleOpenDetails(doc)}
                      >
                        <Visibility fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
                  <Typography variant='body1' color='text.secondary'>
                    No documents found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedDocument)} onClose={handleCloseDetails} maxWidth='sm' fullWidth>
        {selectedDocument && (
          <>
            <DialogTitle
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant='h6'>Document Details</Typography>
              {getStatusChip(selectedDocument.verification_status)}
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Document Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Description color='action' sx={{ mr: 1 }} />
                    <Typography variant='body1'>
                      {selectedDocument.document_type.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    File Name
                  </Typography>
                  <Typography variant='body1' sx={{ mt: 0.5 }}>
                    {selectedDocument.file_name}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Date Uploaded
                  </Typography>
                  <Typography variant='body1' sx={{ mt: 0.5 }}>
                    {new Date(selectedDocument.created_at).toLocaleString()}
                  </Typography>
                </Grid>

                {selectedDocument.verification_notes && (
                  <Grid item xs={12}>
                    <Alert
                      severity={
                        selectedDocument.verification_status === 'rejected' ? 'error' : 'info'
                      }
                    >
                      <Typography variant='subtitle2' fontWeight='bold'>
                        {selectedDocument.verification_status === 'rejected'
                          ? 'Rejection Reason:'
                          : 'Notes:'}
                      </Typography>
                      <Typography variant='body2' sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {selectedDocument.verification_notes}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDetails} variant='outlined'>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ResidentDocuments;
