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
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import axios from 'axios';

const ComplaintHistory = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchComplaints();
  }, [pagination.page]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/blotter-complaints/my-complaints', {
        params: { page: pagination.page, limit: pagination.limit }
      });
      
      if (response.data.success) {
        setComplaints(response.data.data);
        setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load complaints' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Scheduled for Mediation': return 'info';
      case 'Amicably Settled': return 'success';
      case 'Certificate to File Action Issued': return 'error';
      case 'Dismissed': return 'default';
      case 'Ongoing': return 'primary';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Blotter Complaints
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Case Number</TableCell>
                  <TableCell>Incident Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Incident Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Hearing Schedule</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        No complaints found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.Case_Number}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {complaint.Case_Number}
                        </Typography>
                      </TableCell>
                      <TableCell>{complaint.Incident_Type}</TableCell>
                      <TableCell>
                        <Chip
                          label={complaint.Status}
                          color={getStatusColor(complaint.Status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(complaint.DateTime_Incident)}</TableCell>
                      <TableCell>{complaint.Location_Sitio}</TableCell>
                      <TableCell>
                        {complaint.Hearing_Schedule ? 
                          formatDate(complaint.Hearing_Schedule) : 
                          'Not scheduled'
                        }
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
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ComplaintHistory;