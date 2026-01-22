import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { Cancel as CancelIcon, Download as DownloadIcon } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const RequestHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState({ open: false, requestId: null });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchRequests();
  }, [pagination.page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/certificate-requests/my-requests', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await apiRequest(`/certificate-requests/${cancelDialog.requestId}/cancel`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Request cancelled successfully' });
        fetchRequests();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel request' });
    } finally {
      setCancelDialog({ open: false, requestId: null });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      <Typography variant='h4' gutterBottom>
        My Certificate Requests
      </Typography>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography color='text.secondary'>No certificate requests found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map(request => (
                    <TableRow key={request.request_id}>
                      <TableCell>
                        <Typography variant='body2' fontFamily='monospace'>
                          {request.request_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.document_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.toUpperCase()}
                          color={getStatusColor(request.status)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                      <TableCell>₱{request.fee || '0.00'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {request.status === 'pending' && (
                            <Button
                              size='small'
                              color='error'
                              startIcon={<CancelIcon />}
                              onClick={() =>
                                setCancelDialog({ open: true, requestId: request.request_id })
                              }
                            >
                              Cancel
                            </Button>
                          )}
                          {request.status === 'completed' && request.control_number && (
                            <Button
                              size='small'
                              color='primary'
                              startIcon={<DownloadIcon />}
                              onClick={() =>
                                window.open(
                                  `/api/certificates/download/${request.control_number}`,
                                  '_blank'
                                )
                              }
                            >
                              Download
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {Math.ceil(pagination.total / pagination.limit) > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={pagination.page}
                onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                color='primary'
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, requestId: null })}
      >
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this certificate request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, requestId: null })}>
            Keep Request
          </Button>
          <Button onClick={handleCancelRequest} color='error' variant='contained'>
            Cancel Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestHistory;
