import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  PieChart,
  BarChart,
  Download,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
  CalendarToday,
  LocationOn,
  AccessTime,
  People,
  Security
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { apiRequest } from '../utils/api';

// Color palette for charts
const COLORS = ['#1DB954', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

const RondaAnalytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState({});
  const [reportDialog, setReportDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState('incident_analysis');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load summary data
      const summaryResponse = await apiRequest('analytics/dashboard-summary');
      const summary = await summaryResponse.json();
      setSummaryData(summary);

      // Load chart data
      const chartTypes = ['incident_trends', 'incident_types', 'sitio_distribution', 'hourly_patterns'];
      const chartPromises = chartTypes.map(type =>
        apiRequest(`analytics/charts/${type}`).then(res => res.json())
      );

      const chartResults = await Promise.all(chartPromises);
      const chartDataMap = {};
      chartTypes.forEach((type, index) => {
        chartDataMap[type] = chartResults[index];
      });

      setChartData(chartDataMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const reportData = {
        report_type: selectedReport,
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        filters: {}
      };

      const response = await apiRequest('analytics/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const report = await response.json();

      // In a real app, this would download or display the report
      console.log('Generated report:', report);

      // Mock download
      const dataStr = JSON.stringify(report, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
      setReportDialog(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction?.toUpperCase()) {
      case 'INCREASING': return <TrendingUp color="error" />;
      case 'DECREASING': return <TrendingDown color="success" />;
      default: return <Timeline color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Ronda.ai Analytics...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              background: 'linear-gradient(45deg, #1DB954, #4ECDC4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Ronda.ai Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered incident analysis and predictive policing insights
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setReportDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Generate Report
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={loadDashboardData}
              sx={{
                borderRadius: 2,
                border: '1px solid #e8eaed',
                '&:hover': { backgroundColor: '#f8f9fa' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summaryData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              border: '1px solid #e8eaed'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 500 }}>
                    Active Cases
                  </Typography>
                  <Security sx={{ color: '#d32f2f', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#d32f2f', mb: 1 }}>
                  {summaryData.active_cases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ongoing investigations
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: '1px solid #e8eaed'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                    30-Day Incidents
                  </Typography>
                  <Assessment sx={{ color: '#2e7d32', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                  {summaryData.total_incidents_30d}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total reported incidents
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)',
              border: '1px solid #e8eaed'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 500 }}>
                    Response Time
                  </Typography>
                  <AccessTime sx={{ color: '#f57c00', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00', mb: 1 }}>
                  {summaryData.response_time_avg}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average response time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              border: '1px solid #e8eaed'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 500 }}>
                    Coverage
                  </Typography>
                  {getTrendIcon(summaryData.trend_direction)}
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                  {summaryData.coverage_percentage}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Area coverage
                  </Typography>
                  <Chip
                    label={summaryData.trend_direction}
                    size="small"
                    color={summaryData.trend_direction === 'INCREASING' ? 'error' : 'success'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* High Risk Areas Alert */}
      {summaryData?.high_risk_areas?.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 4, borderRadius: 2 }}
          icon={<Warning />}
        >
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
            High-Risk Areas Identified
          </Typography>
          <Typography variant="body2">
            Areas requiring immediate attention: {summaryData.high_risk_areas.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Charts Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              minHeight: 64
            }
          }}
        >
          <Tab
            icon={<Timeline />}
            label="Incident Trends"
            iconPosition="start"
          />
          <Tab
            icon={<PieChart />}
            label="Incident Types"
            iconPosition="start"
          />
          <Tab
            icon={<LocationOn />}
            label="Area Distribution"
            iconPosition="start"
          />
          <Tab
            icon={<AccessTime />}
            label="Hourly Patterns"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 400 }}>
          {activeTab === 0 && chartData.incident_trends && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Incident Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData.incident_trends.datasets?.[0]?.data?.map((value, index) => ({
                  date: chartData.incident_trends.labels?.[index] || `Day ${index + 1}`,
                  incidents: value
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#1DB954"
                    fill="rgba(29, 185, 84, 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 1 && chartData.incident_types && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Incidents by Type
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPieChart>
                  <Pie
                    data={chartData.incident_types.labels?.map((label, index) => ({
                      name: label,
                      value: chartData.incident_types.datasets?.[0]?.data?.[index] || 0
                    })) || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.incident_types.labels?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )) || []}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 2 && chartData.sitio_distribution && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Incidents by Barangay Area
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBarChart
                  data={chartData.sitio_distribution.labels?.map((label, index) => ({
                    area: label,
                    incidents: chartData.sitio_distribution.datasets?.[0]?.data?.[index] || 0
                  })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="incidents" fill="#1DB954" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 3 && chartData.hourly_patterns && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Incident Patterns by Hour
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={chartData.hourly_patterns.labels?.map((label, index) => ({
                    hour: label,
                    incidents: chartData.hourly_patterns.datasets?.[0]?.data?.[index] || 0
                  })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#1DB954"
                    strokeWidth={3}
                    dot={{ fill: '#1DB954', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* AI Insights Panel */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e8eaed' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#1DB954', mr: 2 }}>
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    AI-Powered Insights
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Machine learning analysis of patterns
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Peak Hours:</strong> Most incidents occur between 8 PM - 2 AM
                  </Typography>
                </Alert>

                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Trend Alert:</strong> Incident rates are stable but monitoring recommended
                  </Typography>
                </Alert>

                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Positive:</strong> Response times improved by 15% this month
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e8eaed' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#FF6B6B', mr: 2 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Recommended Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-suggested interventions
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#f57c00', mb: 1 }}>
                    High Priority
                  </Typography>
                  <Typography variant="body2">
                    Increase nighttime patrols in high-risk areas by 40%
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#e8f5e8', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32', mb: 1 }}>
                    Community Program
                  </Typography>
                  <Typography variant="body2">
                    Launch neighborhood watch program in Batia Proper
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2', mb: 1 }}>
                    Resource Allocation
                  </Typography>
                  <Typography variant="body2">
                    Deploy additional security cameras to monitored areas
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Generation Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Generate Analytics Report
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="incident_analysis">Incident Analysis Report</MenuItem>
              <MenuItem value="trend_analysis">Trend Analysis Report</MenuItem>
              <MenuItem value="predictive_forecast">Predictive Forecast Report</MenuItem>
              <MenuItem value="resource_allocation">Resource Allocation Report</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={generatingReport}
            startIcon={generatingReport ? <CircularProgress size={20} /> : <Download />}
          >
            {generatingReport ? 'Generating...' : 'Generate & Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RondaAnalytics;
