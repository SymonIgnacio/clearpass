import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grow,
  Fade,
  useTheme,
  alpha
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
  Security,
  HelpOutline,
  AutoGraph
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
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState({});
  const [reportDialog, setReportDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState('incident_analysis');
  
  // New Features State
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    // Check if first visit for tour (mock)
    // if (!localStorage.getItem('ronda_tour_completed')) setTourOpen(true);
    
    return () => stopAutoRefresh();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadDashboardData(true); // silent refresh
      }, 30000);
    } else {
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [autoRefresh]);

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Load summary data
      const summaryResponse = await apiRequest('ai-analytics/dashboard-summary');
      const summary = await summaryResponse.json();
      setSummaryData(summary);

      // Load chart data
      const chartTypes = ['incident_trends', 'incident_types', 'sitio_distribution', 'hourly_patterns'];
      const chartPromises = chartTypes.map(type =>
        apiRequest(`ai-analytics/charts/${type}`).then(res => res.json())
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

      const response = await apiRequest('ai-analytics/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const report = await response.json();

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

  // Tour Steps
  const tourSteps = [
    {
      label: 'Welcome to Ronda.ai',
      description: 'This dashboard provides AI-powered insights into community safety and patrol efficiency.',
    },
    {
      label: 'Real-time Monitoring',
      description: 'Track active cases and response times instantly. Use the "Auto-Refresh" toggle to keep data live.',
    },
    {
      label: 'Predictive Analytics',
      description: 'Our AI analyzes patterns to predict high-risk areas and times, helping you deploy tanods effectively.',
    },
    {
      label: 'Automated Reports',
      description: 'Generate detailed PDF/JSON reports for official documentation with a single click.',
    },
  ];

  const handleNextStep = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCloseTour = () => {
    setTourOpen(false);
    setActiveStep(0);
    localStorage.setItem('ronda_tour_completed', 'true');
  };

  const getCardBackground = (gradientLight) => {
    if (theme.palette.mode === 'dark') {
      return theme.palette.background.paper;
    }
    return gradientLight;
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <CircularProgress size={60} sx={{ mb: 2, color: '#1DB954' }} />
        <Typography variant="h6" color="text.secondary">
          Initializing AI Models...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(45deg, #1DB954, #4ECDC4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AutoGraph sx={{ color: '#1DB954' }} fontSize="large" />
            Ronda.ai Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Predictive policing and incident analysis dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Live Mode"
          />
          
          <Button
            variant="outlined"
            startIcon={<HelpOutline />}
            onClick={() => setTourOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Guide
          </Button>

          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => setReportDialog(true)}
            sx={{ borderRadius: 2, bgcolor: '#1DB954', '&:hover': { bgcolor: '#169c46' } }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summaryData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              title: 'Active Cases', 
              value: summaryData.active_cases, 
              sub: 'Ongoing investigations', 
              color: '#d32f2f', 
              bg: 'linear-gradient(135deg, #ffebee 0%, #ffffff 100%)',
              icon: <Security sx={{ color: '#d32f2f', fontSize: 32 }} /> 
            },
            { 
              title: '30-Day Incidents', 
              value: summaryData.total_incidents_30d, 
              sub: 'Total reported incidents', 
              color: '#2e7d32', 
              bg: 'linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%)',
              icon: <Assessment sx={{ color: '#2e7d32', fontSize: 32 }} /> 
            },
            { 
              title: 'Response Time', 
              value: summaryData.response_time_avg, 
              sub: 'Average response time', 
              color: '#f57c00', 
              bg: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
              icon: <AccessTime sx={{ color: '#f57c00', fontSize: 32 }} /> 
            },
            { 
              title: 'Coverage', 
              value: `${summaryData.coverage_percentage}%`, 
              sub: 'Area coverage', 
              color: '#1976d2', 
              bg: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
              icon: getTrendIcon(summaryData.trend_direction) 
            }
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Grow in={true} timeout={500 + (index * 200)}>
                <Card sx={{
                  background: getCardBackground(item.bg),
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  height: '100%',
                  border: theme.palette.mode === 'dark' ? `1px solid ${alpha(item.color, 0.3)}` : 'none'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: item.color, fontWeight: 600, fontSize: '1rem' }}>
                        {item.title}
                      </Typography>
                      {item.icon}
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? 'text.primary' : '#333', mb: 1 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.sub}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      )}

      {/* High Risk Areas Alert */}
      {summaryData?.high_risk_areas?.length > 0 && (
        <Fade in={true}>
          <Alert
            severity="warning"
            sx={{ mb: 4, borderRadius: 2, border: '1px solid #ff9800' }}
            icon={<Warning fontSize="inherit" />}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Attention Required
            </Typography>
            <Typography variant="body2">
              High-risk areas identified in: <strong>{summaryData.high_risk_areas.join(', ')}</strong>. Immediate patrol reinforcement recommended.
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Charts Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 64
            },
            '& .Mui-selected': {
              color: '#1DB954'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1DB954'
            }
          }}
        >
          <Tab icon={<Timeline />} label="Incident Trends" iconPosition="start" />
          <Tab icon={<PieChart />} label="Incident Types" iconPosition="start" />
          <Tab icon={<LocationOn />} label="Area Distribution" iconPosition="start" />
          <Tab icon={<AccessTime />} label="Hourly Patterns" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 450 }}>
          {activeTab === 0 && chartData.incident_trends && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Incident Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData.incident_trends.datasets?.[0]?.data?.map((value, index) => ({
                  date: chartData.incident_trends.labels?.[index] || `Day ${index + 1}`,
                  incidents: value
                })) || []}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1DB954" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#1DB954"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIncidents)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 1 && chartData.incident_types && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
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
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationDuration={1500}
                  >
                    {chartData.incident_types.labels?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )) || []}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 2 && chartData.sitio_distribution && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Incidents by Barangay Area
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBarChart
                  data={chartData.sitio_distribution.labels?.map((label, index) => ({
                    area: label,
                    incidents: chartData.sitio_distribution.datasets?.[0]?.data?.[index] || 0
                  })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="incidents" fill="#1DB954" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 3 && chartData.hourly_patterns && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Incident Patterns by Hour
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={chartData.hourly_patterns.labels?.map((label, index) => ({
                    hour: label,
                    incidents: chartData.hourly_patterns.datasets?.[0]?.data?.[index] || 0
                  })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#1DB954"
                    strokeWidth={4}
                    dot={{ fill: '#1DB954', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* AI Insights Panel */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha('#1DB954', 0.2) : '#e8f5e9', color: '#1DB954', mr: 2, width: 48, height: 48 }}>
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
          <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha('#FF6B6B', 0.2) : '#ffebee', color: '#FF6B6B', mr: 2, width: 48, height: 48 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recommended Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-suggested interventions
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper elevation={0} sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.15) : '#fff3e0', 
                  borderRadius: 2, 
                  borderLeft: '4px solid #f57c00' 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'warning.light' : '#f57c00', mb: 0.5 }}>
                    High Priority
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Increase nighttime patrols in high-risk areas by 40%
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.15) : '#e8f5e8', 
                  borderRadius: 2, 
                  borderLeft: '4px solid #2e7d32' 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'success.light' : '#2e7d32', mb: 0.5 }}>
                    Community Program
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Launch neighborhood watch program in Batia Proper
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.15) : '#e3f2fd', 
                  borderRadius: 2, 
                  borderLeft: '4px solid #1976d2' 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'info.light' : '#1976d2', mb: 0.5 }}>
                    Resource Allocation
                  </Typography>
                  <Typography variant="body2" color="text.primary">
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Generate Analytics Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the type of report you wish to generate. The report will include all current dashboard metrics and charts.
          </Typography>
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReportDialog(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={generatingReport}
            startIcon={generatingReport ? <CircularProgress size={20} /> : <Download />}
            sx={{ borderRadius: 2, bgcolor: '#1DB954', '&:hover': { bgcolor: '#169c46' } }}
          >
            {generatingReport ? 'Generating...' : 'Generate & Download'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Onboarding Tour Dialog */}
      <Dialog
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoGraph color="primary" />
          Ronda.ai Quick Guide
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {tourSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {step.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === tourSteps.length - 1 ? handleCloseTour : handleNextStep}
                      sx={{ mt: 1, mr: 1, borderRadius: 2 }}
                      size="small"
                    >
                      {index === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBackStep}
                      sx={{ mt: 1, mr: 1, borderRadius: 2 }}
                      size="small"
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RondaAnalytics;
