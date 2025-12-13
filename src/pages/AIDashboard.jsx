import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import {
  SmartToy,
  Analytics,
  Chat,
  Security,
  TrendingUp,
  Assessment,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
  Timeline,
  PieChart,
  BarChart,
  LocationOn,
  AccessTime,
  People,
  Psychology,
  Speed,
  NotificationsActive,
  Assignment,
  Schedule
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

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [patrolData, setPatrolData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState('incident_analysis');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadAllAIData();
  }, []);

  const loadAllAIData = async () => {
    setLoading(true);
    try {
      // Load all AI data in parallel
      const [patrolResponse, analyticsResponse] = await Promise.all([
        apiRequest('ai/patrol-suggestions').then(res => res.json()).catch(() => ({ error: 'Service unavailable' })),
        apiRequest('analytics/dashboard-summary').then(res => res.json()).catch(() => ({ error: 'Service unavailable' }))
      ]);

      if (patrolResponse && !patrolResponse.error) {
        setPatrolData(patrolResponse);
      }

      if (analyticsResponse && !analyticsResponse.error) {
        setAnalyticsData(analyticsResponse);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await apiRequest('ai/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          session_id: 'ai_dashboard_session',
          context: {}
        })
      });

      const responseData = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: responseData.response,
        isUser: false,
        timestamp: new Date(),
        intent: responseData.intent,
        confidence: responseData.confidence
      };

      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
        headers: { 'Content-Type': 'application/json' },
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

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            Loading AI Dashboard...
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
            <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI Command Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unified AI-powered barangay management dashboard
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setReportDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Generate Report
          </Button>
          <Tooltip title="Refresh AI Data">
            <IconButton
              onClick={loadAllAIData}
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

      {/* Quick Stats Overview */}
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
                {analyticsData?.active_cases || 0}
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
                {analyticsData?.total_incidents_30d || 0}
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
                <Speed sx={{ color: '#f57c00', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00', mb: 1 }}>
                {analyticsData?.response_time_avg || 'N/A'}
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
                  AI Coverage
                </Typography>
                <Psychology sx={{ color: '#1976d2', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                {analyticsData?.coverage_percentage || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Area coverage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
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
              minHeight: 64,
              minWidth: 120
            }
          }}
        >
          <Tab
            icon={<Security />}
            label="AI Patrol"
            iconPosition="start"
          />
          <Tab
            icon={<Analytics />}
            label="Analytics"
            iconPosition="start"
          />
          <Tab
            icon={<Chat />}
            label="BANTAY Chat"
            iconPosition="start"
          />
          <Tab
            icon={<Psychology />}
            label="AI Insights"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 500 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Predictive Patrol System
              </Typography>

              {patrolData && patrolData.overall_risk_level && (
                <>
                  <Alert
                    severity={
                      patrolData.overall_risk_level === 'High' ? 'error' :
                      patrolData.overall_risk_level === 'Medium' ? 'warning' : 'success'
                    }
                    sx={{ mb: 4 }}
                  >
                    <Typography variant="h6">
                      Current Risk Level: {patrolData.overall_risk_level}
                    </Typography>
                    {patrolData.hotspot_area && (
                      <Typography>
                        Hotspot Area Identified: <strong>{patrolData.hotspot_area}</strong>
                      </Typography>
                    )}
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Patrol Recommendations
                          </Typography>
                          <List>
                            {patrolData.patrol_suggestions?.slice(0, 5).map((suggestion, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <Assignment color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={suggestion} />
                              </ListItem>
                            )) || (
                              <ListItem>
                                <ListItemText primary="No patrol recommendations available" />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Risk Analysis Summary
                          </Typography>
                          <Typography variant="body2" paragraph>
                            Analysis Period: Recent blotter records from the past 30 days
                          </Typography>
                          <Typography variant="body2" paragraph>
                            Risk assessment based on incident frequency and severity patterns
                          </Typography>
                          <Typography variant="body2">
                            AI model continuously monitors and updates patrol recommendations
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {(!patrolData || !patrolData.overall_risk_level) && (
                <Alert severity="warning" sx={{ mb: 4 }}>
                  <Typography variant="body1">
                    <strong>AI Patrol Service Unavailable</strong>
                  </Typography>
                  <Typography variant="body2">
                    Unable to load patrol recommendations at this time. Please try refreshing the page.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                Ronda.ai Analytics Dashboard
              </Typography>

              {analyticsData && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Incident Trends (Last 30 Days)
                        </Typography>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { date: 'Day 1', incidents: 2 },
                              { date: 'Day 7', incidents: 5 },
                              { date: 'Day 14', incidents: 3 },
                              { date: 'Day 21', incidents: 7 },
                              { date: 'Day 28', incidents: 4 }
                            ]}>
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
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Key Metrics
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Active Cases:</Typography>
                            <Chip label={analyticsData.active_cases || 0} color="error" size="small" />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">30-Day Incidents:</Typography>
                            <Chip label={analyticsData.total_incidents_30d || 0} color="warning" size="small" />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Coverage:</Typography>
                            <Chip label={`${analyticsData.coverage_percentage || 0}%`} color="success" size="small" />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {!analyticsData && (
                <Box>
                  <Alert severity="info" sx={{ mb: 4 }}>
                    <strong>Analytics Dashboard</strong><br />
                    Service temporarily unavailable - showing sample incident data.
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Sample Incident Trends (Last 30 Days)
                          </Typography>
                          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="body1" color="text.secondary">
                                Sample trend data would appear here
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Chart shows incident patterns over time
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Sample Key Metrics
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Active Cases:</Typography>
                              <Chip label="5" color="error" size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">30-Day Incidents:</Typography>
                              <Chip label="28" color="warning" size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Coverage:</Typography>
                              <Chip label="78%" color="success" size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">Response Time:</Typography>
                              <Chip label="12 min" color="info" size="small" />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
                BANTAY AI Assistant
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ height: 400 }}>
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" gutterBottom>
                        Chat History
                      </Typography>
                      <Box sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        mb: 2,
                        p: 1,
                        border: '1px solid #e8eaed',
                        borderRadius: 1
                      }}>
                        {chatMessages.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                            Start a conversation with BANTAY AI Assistant
                          </Typography>
                        ) : (
                          chatMessages.map((message) => (
                            <Box
                              key={message.id}
                              sx={{
                                display: 'flex',
                                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                mb: 1
                              }}
                            >
                              <Paper
                                sx={{
                                  p: 1,
                                  maxWidth: '70%',
                                  backgroundColor: message.isUser ? '#1DB954' : '#f5f5f5',
                                  color: message.isUser ? 'white' : 'black'
                                }}
                              >
                                <Typography variant="body2">
                                  {message.text}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                  {formatTime(message.timestamp)}
                                </Typography>
                              </Paper>
                            </Box>
                          ))
                        )}
                        {isTyping && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                            <Paper sx={{ p: 1, backgroundColor: '#f5f5f5' }}>
                              <Typography variant="body2" color="text.secondary">
                                BANTAY is typing...
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type your message..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                          disabled={isTyping}
                        />
                        <Button
                          variant="contained"
                          onClick={handleChatMessage}
                          disabled={!chatInput.trim() || isTyping}
                          sx={{ backgroundColor: '#1DB954' }}
                        >
                          Send
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quick Actions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setChatInput("I need help with a barangay clearance")}
                        >
                          Certificate Help
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setChatInput("How do I file a blotter report?")}
                        >
                          Blotter Filing
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setChatInput("What are your office hours?")}
                        >
                          Office Hours
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setChatInput("I want to schedule an appointment")}
                        >
                          Make Appointment
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Insights & Recommendations
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <NotificationsActive sx={{ mr: 1, verticalAlign: 'middle' }} />
                        AI-Powered Insights
                      </Typography>
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
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Recommended Actions
                      </Typography>
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
                            Launch neighborhood watch program in hotspot areas
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
            </Box>
          )}
        </Box>
      </Paper>

      {/* Report Generation Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Generate AI Analytics Report
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
            startIcon={generatingReport ? <CircularProgress size={20} /> : <Assessment />}
          >
            {generatingReport ? 'Generating...' : 'Generate & Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIDashboard;
