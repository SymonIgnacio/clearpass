import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Alert,
} from '@mui/material';
import {
  Gavel,
  Refresh,
  Security,
  SmartToy,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Add,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../contexts/useAuth';

const BlotterDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active_blotter: 0,
    resolved_cases: 0,
  });
  const [blotterCases, setBlotterCases] = useState([]);
  const [patrolSuggestions, setPatrolSuggestions] = useState(null);
  const [patrolLoading, setPatrolLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await apiRequest('dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }

      const caseResponse = await apiRequest('blotter');
      if (caseResponse.ok) {
        const caseData = await caseResponse.json();
        setBlotterCases(Array.isArray(caseData) ? caseData : []);
      }
    } catch (error) {
      console.error('Error fetching blotter dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatrolSuggestions = async () => {
    setPatrolLoading(true);
    try {
      const response = await apiRequest('ai/patrol-suggestions');
      const data = await response.json();
      setPatrolSuggestions(data);
    } catch (error) {
      console.error('Error fetching patrol suggestions:', error);
    } finally {
      setPatrolLoading(false);
    }
  };

  const handleQuickAction = action => {
    switch (action) {
      case 'Report Incident':
        navigate('/officer/new-case');
        break;
      case 'View Cases':
        navigate('/blotter');
        break;
      case 'AI Analysis':
        navigate('/ai-patrol');
        break;
      default:
        break;
    }
  };

  const statCards = [
    {
      title: 'Active Cases',
      value:
        stats.active_blotter ||
        blotterCases.filter(c => c.Status === 'Pending' || c.Status === 'Active').length,
      subtitle: 'Ongoing Investigations',
      icon: <Gavel sx={{ fontSize: 32 }} />,
      color: '#ea4335',
      bgColor: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      status: 'Pending',
      statusLabel: 'Status',
    },
    {
      title: 'Crime Analytics',
      value: 'AI Ready',
      subtitle: 'Predictive Models Active',
      icon: <SmartToy sx={{ fontSize: 32 }} />,
      color: '#fbbc04',
      bgColor: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
      status: 'Online',
      statusLabel: 'System',
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 400,
              mb: 1,
              background: 'linear-gradient(45deg, #ea4335, #fbbc04)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Blotter Command Center
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Case Management and Peace & Order Control
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<Security />}
            label='Officer Access'
            color='error'
            variant='outlined'
            sx={{ borderRadius: 2 }}
          />
          <Tooltip title='Refresh Data'>
            <IconButton
              onClick={fetchDashboardData}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Card
              sx={{
                height: '100%',
                background: isDarkMode
                  ? `linear-gradient(135deg, ${alpha(card.color, 0.26)} 0%, ${alpha(card.color, 0.14)} 100%)`
                  : card.bgColor,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: card.color, width: 56, height: 56 }}>{card.icon}</Avatar>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant='body2' sx={{ color: card.color, fontWeight: 600 }}>
                      {card.status}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant='h3' sx={{ fontWeight: 600, mb: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant='contained'
                  color='error'
                  startIcon={<Add />}
                  onClick={() => handleQuickAction('Report Incident')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  New Case Report
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<Gavel />}
                  onClick={() => handleQuickAction('View Cases')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  View All Cases
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<Analytics />}
                  onClick={() => handleQuickAction('AI Analysis')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  AI Crime Analysis
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Patrol Intelligence (Reused from main Dashboard) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant='h6'>AI Patrol Intelligence</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Real-time crime risk assessment
                  </Typography>
                </Box>
              </Box>

              <Button
                variant='outlined'
                startIcon={patrolLoading ? <CircularProgress size={20} /> : <Analytics />}
                onClick={fetchPatrolSuggestions}
                disabled={patrolLoading}
                sx={{ mb: 3 }}
              >
                {patrolLoading ? 'Analyzing...' : 'Generate Patrol Plan'}
              </Button>

              {patrolSuggestions && (
                <Box>
                  <Alert
                    severity={
                      patrolSuggestions.overall_risk_level === 'CRITICAL'
                        ? 'error'
                        : patrolSuggestions.overall_risk_level === 'HIGH'
                          ? 'error'
                          : patrolSuggestions.overall_risk_level === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                    }
                    sx={{ mb: 3 }}
                  >
                    <Typography variant='subtitle1' fontWeight='bold'>
                      {patrolSuggestions.overall_risk_level} RISK LEVEL
                    </Typography>
                    <Typography variant='body2'>
                      Focus Area: {patrolSuggestions.risk_assessment?.peak_hours || 'N/A'}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2}>
                    {patrolSuggestions.patrol_suggestions?.slice(0, 2).map((rec, i) => (
                      <Grid item xs={12} key={i}>
                        <Paper variant='outlined' sx={{ p: 2 }}>
                          <Typography variant='body2' fontWeight='bold'>
                            Suggestion {i + 1}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {rec}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {!patrolSuggestions && !patrolLoading && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Click "Generate Patrol Plan" to view AI recommendations
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlotterDashboard;
