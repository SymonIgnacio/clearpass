import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiRequest } from '../utils/api';

const ClerkAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await apiRequest('/ai-analytics/clerk-insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load insights' });
    } finally {
      setLoading(false);
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Workload Insights
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {insights && (
        <Grid container spacing={3}>
          {/* Capacity Metrics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Capacity Planning</Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {insights.capacity_metrics.total_pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Avg Processing: {insights.capacity_metrics.avg_processing_days} days
                  </Typography>
                  <Chip 
                    label={`Recommended: ${insights.capacity_metrics.recommended_capacity} req/day`}
                    color="info"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Certificate Demand */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Certificate Demand (Last 30 Days)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insights.certificate_demand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="document_type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_requests" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Workload Trend */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily Request Trend (Last 7 Days)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={insights.workload_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="daily_requests" stroke="#1976d2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Certificate Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Certificate Processing Details</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell align="right">Total Requests</TableCell>
                        <TableCell align="right">Pending</TableCell>
                        <TableCell align="right">Avg Processing Days</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insights.certificate_demand.map((cert) => (
                        <TableRow key={cert.document_type}>
                          <TableCell>{cert.document_type}</TableCell>
                          <TableCell align="right">{cert.total_requests}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={cert.pending_count}
                              color={cert.pending_count > 5 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {Math.round(cert.avg_processing_days * 10) / 10}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ClerkAIInsights;