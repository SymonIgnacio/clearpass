import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { QrCodeScanner, Print, Download } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const OfficerAttendance = () => {
  const [hearings, setHearings] = useState([]);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHearings();
  }, []);

  const fetchHearings = async () => {
    try {
      const response = await apiRequest('/case-management/hearings');
      const data = await response.json();
      setHearings(data.data || []);
    } catch (error) {
      console.error('Error fetching hearings:', error);
    }
  };

  const fetchAttendance = async (hearingId) => {
    try {
      const response = await apiRequest(`/case-management/attendance/${hearingId}`);
      const data = await response.json();
      setAttendance(data.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const generateQRCode = async (hearingId) => {
    try {
      const response = await apiRequest('/case-management/generate-qr', {
        method: 'POST',
        body: {
          hearing_id: hearingId,
          type: 'attendance'
        }
      });
      const data = await response.json();
      
      // Create QR code display
      const qrData = data.qr_code;
      setMessage('QR Code generated successfully!');
      
      // You can implement QR code display here
      console.log('QR Code data:', qrData);
    } catch (error) {
      setMessage('Error generating QR code: ' + error.message);
    }
  };

  const handleQRScan = async () => {
    if (!scannedCode.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('/case-management/mark-attendance', {
        method: 'POST',
        body: {
          qr_code: scannedCode,
          timestamp: new Date().toISOString()
        }
      });
      
      setMessage('Attendance marked successfully!');
      setScannedCode('');
      setQrDialogOpen(false);
      
      if (selectedHearing) {
        fetchAttendance(selectedHearing.id);
      }
    } catch (error) {
      setMessage('Error marking attendance: ' + error.message);
    }
    setLoading(false);
  };

  const exportAttendance = async (hearingId) => {
    try {
      const response = await apiRequest(`/case-management/attendance-report/${hearingId}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${hearingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Error exporting attendance report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Hearing Attendance Management</Typography>
      
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Scheduled Hearings</Typography>
            {hearings.map((hearing) => (
              <Card 
                key={hearing.id} 
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  border: selectedHearing?.id === hearing.id ? 2 : 1,
                  borderColor: selectedHearing?.id === hearing.id ? 'primary.main' : 'divider'
                }}
                onClick={() => {
                  setSelectedHearing(hearing);
                  fetchAttendance(hearing.id);
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Case #{hearing.case_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(hearing.hearing_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hearing.hearing_time}
                  </Typography>
                  <Chip 
                    label={hearing.status} 
                    size="small" 
                    color={hearing.status === 'scheduled' ? 'primary' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedHearing ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Attendance for Case #{selectedHearing.case_number}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<QrCodeScanner />}
                    variant="outlined"
                    onClick={() => setQrDialogOpen(true)}
                  >
                    Scan QR
                  </Button>
                  <Button
                    startIcon={<Print />}
                    variant="outlined"
                    onClick={() => generateQRCode(selectedHearing.id)}
                  >
                    Generate QR
                  </Button>
                  <Button
                    startIcon={<Download />}
                    variant="contained"
                    onClick={() => exportAttendance(selectedHearing.id)}
                  >
                    Export Report
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Participant</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time Arrived</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.participant_name}</TableCell>
                        <TableCell>
                          <Chip label={record.role} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={record.status} 
                            color={getStatusColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {record.arrival_time ? 
                            new Date(record.arrival_time).toLocaleTimeString() : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {attendance.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No attendance records found for this hearing
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Select a hearing to view attendance records
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* QR Scanner Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Scan QR Code for Attendance</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="QR Code Data"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            placeholder="Scan or enter QR code data"
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Use a QR scanner app or manually enter the QR code data
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleQRScan} 
            variant="contained" 
            disabled={loading || !scannedCode.trim()}
          >
            {loading ? 'Processing...' : 'Mark Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficerAttendance;