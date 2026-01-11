import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert
} from '@mui/material';
import { Download, Print, Visibility } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiRequest } from '../utils/api';

const OfficerReports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const reportTypes = [
    { value: 'monthly', label: 'Monthly Summary' },
    { value: 'incident', label: 'Incident Analysis' },
    { value: 'resolution', label: 'Resolution Report' },
    { value: 'attendance', label: 'Hearing Attendance' }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/case-management/reports', {
        method: 'POST',
        body: {
          type: reportType,
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      });
      const data = await response.json();
      
      setReportData(data.data);
      setMessage('Report generated successfully!');
    } catch (error) {
      setMessage('Error generating report: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const exportReport = async (format = 'pdf') => {
    try {
      const response = await apiRequest('/case-management/export-report', {
        method: 'POST',
        body: {
          type: reportType,
          start_date: dateRange.start,
          end_date: dateRange.end,
          format
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `blotter-report-${reportType}-${dateRange.start}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Error exporting report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'pending': return 'warning';
      case 'under_investigation': return 'info';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Blotter Reports & Analytics</Typography>
      
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Report Configuration</Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {reportTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Cases</Typography>
                  <Typography variant="h4">{reportData.summary?.total_cases || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Resolved Cases</Typography>
                  <Typography variant="h4" color="success.main">
                    {reportData.summary?.resolved_cases || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Pending Cases</Typography>
                  <Typography variant="h4" color="warning.main">
                    {reportData.summary?.pending_cases || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Resolution Rate</Typography>
                  <Typography variant="h4" color="info.main">
                    {reportData.summary?.resolution_rate || 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Cases by Month</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthly_data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cases" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Cases by Status</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.status_data || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(reportData.status_data || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Cases Table */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Cases</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                  onClick={() => exportReport('pdf')}
                >
                  Export PDF
                </Button>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                  onClick={() => exportReport('xlsx')}
                >
                  Export Excel
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Case Number</TableCell>
                    <TableCell>Incident Type</TableCell>
                    <TableCell>Date Filed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Complainant</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.recent_cases || []).map((case_item) => (
                    <TableRow key={case_item.id}>
                      <TableCell>{case_item.case_number}</TableCell>
                      <TableCell>{case_item.incident_type}</TableCell>
                      <TableCell>
                        {new Date(case_item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={case_item.status} 
                          color={getStatusColor(case_item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{case_item.complainant_name}</TableCell>
                      <TableCell>
                        <Button
                          startIcon={<Visibility />}
                          size="small"
                          onClick={() => window.open(`/officer/case/${case_item.id}`, '_blank')}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!reportData && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Configure report parameters and click "Generate Report" to view analytics
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default OfficerReports;
