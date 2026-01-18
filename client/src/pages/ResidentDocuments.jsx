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
  Alert
} from '@mui/material';
import {
  Description,
  CloudDownload,
  Visibility,
  CheckCircle,
  Pending,
  Error,
  FolderShared
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/useAuth';

const ResidentDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Determine endpoint based on role/status could be handled by a unified endpoint 
      // but we updated the controller to handle it via /residents/:id/documents or just /resident-documents
      // Let's assume we can use a dedicated endpoint or the profile one.
      // Based on controller update: exports.listDocuments
      // Route likely: /api/residents/:id/documents
      // If we don't have an ID (guest), we can pass 'me' or just handle it in the route
      
      const response = await apiRequest(`/residents/me/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Could not load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      verified: { color: 'success', icon: <CheckCircle />, label: 'Verified' },
      approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
      pending: { color: 'warning', icon: <Pending />, label: 'Pending Review' },
      rejected: { color: 'error', icon: <Error />, label: 'Rejected' }
    };

    const config = statusMap[status?.toLowerCase()] || statusMap.pending;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
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

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
            <FolderShared />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              My Documents
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Track the status of your submitted documents and proofs.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Document Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Date Uploaded</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              {/* <TableCell align="right">Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description color="action" sx={{ mr: 1.5 }} />
                      <Typography variant="body2" fontWeight="500">
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
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{getStatusChip(doc.verification_status)}</TableCell>
                  <TableCell>
                    {doc.verification_notes ? (
                      <Typography variant="caption" color="error">
                        {doc.verification_notes}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  {/* <TableCell align="right">
                    <Tooltip title="Download">
                      <IconButton size="small">
                        <CloudDownload fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No documents found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResidentDocuments;
