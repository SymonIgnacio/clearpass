import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  QrCode as QrCodeIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

const CaseDetail = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    hearing_schedule: '',
    notes: ''
  });

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      const response = await axios.get(`/api/case-management/case/${caseId}`);
      if (response.data.success) {
        setCaseData(response.data.data);
        setStatusUpdate({
          status: response.data.data.Status,
          hearing_schedule: response.data.data.Hearing_Schedule ? 
            new Date(response.data.data.Hearing_Schedule).toISOString().slice(0, 16) : '',
          notes: ''
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load case details' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const response = await axios.put(`/api/case-management/case/${caseId}/status`, statusUpdate);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Case status updated successfully' });
        fetchCaseDetails();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update case status' });
    } finally {
      setUpdating(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await axios.post(`/api/case-management/case/${caseId}/qr`, {
        hearing_date: statusUpdate.hearing_schedule
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'QR code generated for hearing attendance' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate QR code' });
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
      month: 'long',
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

  if (!caseData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Case not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Details: {caseData.Case_Number}
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Case Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GavelIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Case Information</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Incident Type</Typography>
                  <Typography variant="body1">{caseData.Incident_Type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={caseData.Status} 
                    color={getStatusColor(caseData.Status)} 
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Incident Date</Typography>
                  <Typography variant="body1">{formatDate(caseData.DateTime_Incident)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{caseData.Location_Sitio}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Narrative</Typography>
                  <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {caseData.Narrative}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Participants</Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {caseData.participants?.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          {participant.First_Name} {participant.Last_Name}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={participant.participation_type} 
                            size="small"
                            color={participant.participation_type === 'Complainant' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{participant.Mobile_Number}</TableCell>
                        <TableCell>
                          <Chip 
                            label={participant.status} 
                            size="small"
                            color={participant.status === 'Active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Case Management */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Case Management</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusUpdate.status}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Scheduled for Mediation">Scheduled for Mediation</MenuItem>
                      <MenuItem value="Ongoing">Ongoing</MenuItem>
                      <MenuItem value="Amicably Settled">Amicably Settled</MenuItem>
                      <MenuItem value="Certificate to File Action Issued">Certificate to File Action</MenuItem>
                      <MenuItem value="Dismissed">Dismissed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Hearing Schedule"
                    value={statusUpdate.hearing_schedule}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, hearing_schedule: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add case notes..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={updating ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    sx={{ mb: 1 }}
                  >
                    Update Case
                  </Button>
                </Grid>

                {statusUpdate.hearing_schedule && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      onClick={generateQRCode}
                    >
                      Generate QR Code
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Case Timeline */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Case Timeline</Typography>
              <Timeline>
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(caseData.created_at)}
                    </Typography>
                    <Typography variant="body1">Case Filed</Typography>
                  </TimelineContent>
                </TimelineItem>
                
                {caseData.Hearing_Schedule && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="info" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(caseData.Hearing_Schedule)}
                      </Typography>
                      <Typography variant="body1">Hearing Scheduled</Typography>
                    </TimelineContent>
                  </TimelineItem>
                )}

                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color={getStatusColor(caseData.Status)} />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2" color="text.secondary">
                      Current Status
                    </Typography>
                    <Typography variant="body1">{caseData.Status}</Typography>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CaseDetail;