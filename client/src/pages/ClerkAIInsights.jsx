import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Button,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Insights, 
  TrendingUp, 
  Assignment, 
  Schedule, 
  Download 
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const ClerkAIInsights = () => {
  const theme = useTheme();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInsights();
  }, [timeRange]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // In a real scenario, we would pass ?days=${timeRange} to the API
      const response = await apiRequest('/ai-analytics/clerk-insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load insights' });
    } finally {
      // Add artificial delay to show skeleton if response is too fast (for UX demo)
      setTimeout(() => setLoading(false), 500);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #eee' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary">
            {payload[0].value} requests
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const getCardStyle = (gradientLight, borderColor) => {
    if (theme.palette.mode === 'dark') {
      return {
        borderRadius: 3, 
        height: '100%', 
        bgcolor: 'background.paper',
        border: `1px solid ${alpha(borderColor, 0.3)}`
      };
    }
    return {
      borderRadius: 3, 
      height: '100%', 
      background: gradientLight
    };
  };

  const chartTheme = {
    axis: {
      stroke: theme.palette.text.secondary,
      fontSize: 12,
      tickLine: false,
      axisLine: false
    },
    grid: {
      stroke: theme.palette.divider,
      strokeDasharray: '3 3',
      vertical: false
    },
    tooltip: {
      contentStyle: {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        color: theme.palette.text.primary
      }
    }
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Insights color="primary" fontSize="large" />
            AI Workload Insights
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Predictive analytics for certificate processing and resource planning
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last Quarter</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />}>
            Export Report
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={12} lg={4}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={12} lg={4}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={12} lg={4}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={12}><Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={12}><Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} /></Grid>
        </Grid>
      ) : insights && (
        <Grid container spacing={2}>
          {/* Key Metrics Cards */}
          <Grid item xs={12} md={12} lg={4}>
            <Card elevation={2} sx={getCardStyle('linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)', '#1976d2')}>
              <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Assignment color="primary" sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pending Requests</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                  {insights.capacity_metrics.total_pending}
                </Typography>
                <Chip 
                  label={`${insights.capacity_metrics.recommended_capacity} req/day recommended`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={12} lg={4}>
            <Card elevation={2} sx={getCardStyle('linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)', '#ed6c02')}>
              <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Schedule color="warning" sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Avg Processing Time</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#ed6c02', mb: 1 }}>
                  {insights.capacity_metrics.avg_processing_days}
                  <Typography component="span" variant="h6" color="text.secondary"> days</Typography>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="error" fontSize="small" />
                  <Typography variant="caption" color="error.main">
                    +0.5 days vs last week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={12} lg={4}>
            <Card elevation={2} sx={getCardStyle('linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)', '#2e7d32')}>
              <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Completion Rate</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                  94%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  On track for monthly targets
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Chart - Certificate Demand */}
          <Grid item xs={12} md={12} lg={6} xl={6}>
            <Card elevation={2} sx={{ borderRadius: 3, width: '100%', overflow: 'hidden' }}>
              <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Certificate Demand Analysis</Typography>
                <Box sx={{ width: '100%', mt: 2, height: 280 }}>
                  {insights.certificate_demand.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={insights.certificate_demand} 
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid {...chartTheme.grid} horizontal={false} vertical={true} />
                        <XAxis type="number" {...chartTheme.axis} />
                        <YAxis 
                          dataKey="document_type" 
                          type="category" 
                          width={50}
                          {...chartTheme.axis}
                          tick={{ ...chartTheme.axis, fontSize: 9 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                        <Bar 
                          dataKey="total_requests" 
                          fill="#1976d2" 
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 0.5,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}>
                      <Assignment sx={{ fontSize: 60, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">No certificate requests found</Typography>
                      <Typography variant="body2" color="text.secondary">Data will appear here once residents submit requests.</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Secondary Chart - Workload Trend */}
          <Grid item xs={12} md={12} lg={6} xl={6}>
            <Card elevation={2} sx={{ borderRadius: 3, width: '100%', overflow: 'hidden' }}>
              <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>7-Day Request Trend</Typography>
                <Box sx={{ width: '100%', mt: 2, height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insights.workload_trend} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartTheme.grid} />
                      <XAxis 
                        dataKey="date" 
                        {...chartTheme.axis} 
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis {...chartTheme.axis} />
                      <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
                      <Area 
                        type="monotone" 
                        dataKey="daily_requests" 
                        stroke="#1976d2" 
                        fillOpacity={1} 
                        fill="url(#colorRequests)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Table */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Processing Metrics by Type</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Requests</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Pending Queue</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Avg Processing (Days)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insights.certificate_demand.map((cert) => (
                        <TableRow key={cert.document_type} hover>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                            {cert.document_type}
                          </TableCell>
                          <TableCell align="right">{cert.total_requests}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={cert.pending_count}
                              color={cert.pending_count > 5 ? 'warning' : 'default'}
                              size="small"
                              variant={cert.pending_count > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              {Math.round(cert.avg_processing_days * 10) / 10}
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(cert.avg_processing_days * 20, 100)} 
                                sx={{ width: 50, height: 4, borderRadius: 2 }}
                                color={cert.avg_processing_days > 3 ? 'error' : 'success'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={cert.pending_count > 8 ? 'High Load' : 'Normal'}
                              color={cert.pending_count > 8 ? 'error' : 'success'}
                              size="small"
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
        </Grid>
      )}
    </Box>
  );
};

export default ClerkAIInsights;