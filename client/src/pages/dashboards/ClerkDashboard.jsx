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
} from '@mui/material';
import {
  Description,
  Refresh,
  Assignment,
  People,
  CheckCircle,
  PendingActions,
  History,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../contexts/useAuth';

const ClerkDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    certificates_issued: 0,
    pending_verifications: 0,
    total_residents: 0,
  });
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Dashboard Stats (reusing generic dashboard endpoint which returns role-specific data)
      const response = await apiRequest('dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }

      // Fetch Recent Certificates
      const certResponse = await apiRequest('certificates');
      if (certResponse.ok) {
        const certData = await certResponse.json();
        setCertificates(certData || []);
      }
    } catch (error) {
      console.error('Error fetching clerk dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = action => {
    switch (action) {
      case 'Issue Certificate':
        navigate('/clerk/documents');
        break;
      case 'Verify Resident':
        navigate('/residents');
        break;
      default:
        break;
    }
  };

  const statCards = [
    {
      title: 'Certificates Issued',
      value: stats.certificates || certificates.length,
      subtitle: 'Total Documents Processed',
      icon: <Description sx={{ fontSize: 32 }} />,
      color: '#34a853',
      bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      status: 'Active',
      statusLabel: 'Service Status',
    },
    {
      title: 'Residents',
      value: stats.residents?.total_residents || stats.overall?.total_residents || 0,
      subtitle: 'Registered Population',
      icon: <People sx={{ fontSize: 32 }} />,
      color: '#1a73e8',
      bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      status: 'Database',
      statusLabel: 'Registry',
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
              background: 'linear-gradient(45deg, #34a853, #1a73e8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Clerk Dashboard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Document Issuance and Resident Verification Portal
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<Assignment />}
            label='Clerk Access'
            color='primary'
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
                  variant='outlined'
                  startIcon={<Description />}
                  onClick={() => handleQuickAction('Issue Certificate')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Issue New Certificate
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<CheckCircle />}
                  onClick={() => handleQuickAction('Verify Resident')}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Verify Resident Info
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity (Certificates) */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant='h6'>Recent Certificates</Typography>
                <Button size='small' onClick={() => navigate('/clerk/documents')}>
                  View All
                </Button>
              </Box>

              {certificates.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {certificates.slice(0, 5).map(cert => (
                    <Paper key={cert.id} variant='outlined' sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant='subtitle2'>{cert.certificate_type}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {cert.resident_name} • {new Date(cert.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={cert.status}
                          size='small'
                          color={cert.status === 'completed' ? 'success' : 'warning'}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <History sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color='text.secondary'>No recent certificates found</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClerkDashboard;
