import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  Description,
  Gavel,
  Notifications,
  CheckCircle,
  Pending,
  Error,
  Warning,
  Add,
  Refresh,
  Logout,
  Settings,
  Home,
  Campaign
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    pending_requests: 0,
    completed_requests: 0,
    profile_completion: 0
  });

  useEffect(() => {
    if (user && user.type === 'resident') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch resident profile
      const profileResponse = await apiRequest('/resident-auth/profile');
      const profileData = await profileResponse.json();
      
      let currentProfile = null;
      if (profileData.success) {
        setProfile(profileData.profile);
        currentProfile = profileData.profile;
      }

      // Fetch certificate requests
      const requestsResponse = await apiRequest('/certificates', {
        params: { resident_id: user.id }
      });
      const requestsData = await requestsResponse.json();
      setRequests(Array.isArray(requestsData) ? requestsData.slice(0, 5) : []);

      // Calculate stats
      const pending = Array.isArray(requestsData) ? requestsData.filter(r => r.status === 'Pending').length : 0;
      const completed = Array.isArray(requestsData) ? requestsData.filter(r => r.status === 'Released').length : 0;
      
      setStats({
        pending_requests: pending,
        completed_requests: completed,
        profile_completion: currentProfile ? calculateProfileCompletion(currentProfile) : 0
      });

      // Mock announcements (to be replaced with real API)
      setAnnouncements([
        {
          id: 1,
          title: 'New Online Services Available',
          message: 'You can now request certificates and file complaints online.',
          date: new Date().toISOString(),
          type: 'info'
        },
        {
          id: 2,
          title: 'Barangay Assembly Meeting',
          message: 'Monthly assembly meeting scheduled for next week.',
          date: new Date().toISOString(),
          type: 'event'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    const fields = [
      'First_Name', 'Last_Name', 'email', 'Mobile_Number', 
      'Birthdate', 'Gender', 'Civil_Status'
    ];
    
    const completed = fields.filter(field => profile[field] && profile[field] !== '').length;
    const percentage = Math.round((completed / fields.length) * 100);
    
    return percentage;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Pending color="warning" />;
      case 'Processing': return <Pending color="info" />;
      case 'Released': return <CheckCircle color="success" />;
      case 'Rejected': return <Error color="error" />;
      default: return <Pending color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'info';
      case 'Released': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/resident/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, width: 200 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
              <Home sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                Welcome, {profile?.First_Name || 'Resident'}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Barangay ClearPass Resident Portal
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchDashboardData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => navigate('/resident/profile')}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} color="error">
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Profile Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Profile Summary
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}>
                    {profile?.First_Name?.charAt(0)}{profile?.Last_Name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {profile?.First_Name} {profile?.Last_Name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile?.email}
                  </Typography>
                  <Chip 
                    label={profile?.Residency_Status || 'Pending Verification'}
                    color={profile?.Residency_Status === 'Active' ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Profile Completion</Typography>
                    <Typography variant="body2">{stats.profile_completion}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.profile_completion}
                    sx={{ borderRadius: 1, height: 8 }}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/resident/profile')}
                  sx={{ borderRadius: 2 }}
                >
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Pending sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {stats.pending_requests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {stats.completed_requests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Description sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                      {requests.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Description />}
                      onClick={() => navigate('/resident/request-clearance')}
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Request Certificate
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Gavel />}
                      onClick={() => navigate('/resident/blotter-report')}
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      File Complaint
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Requests */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Requests
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/resident/requests')}
                  >
                    View All
                  </Button>
                </Box>

                {requests.length > 0 ? (
                  <List>
                    {requests.map((request, index) => (
                      <React.Fragment key={request.id || index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            {getStatusIcon(request.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={request.certificate_type || 'Certificate Request'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {request.purpose || 'General Purpose'}
                                </Typography>
                                <Chip 
                                  label={request.status || 'Pending'}
                                  color={getStatusColor(request.status)}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < requests.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      No requests yet
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/resident/request-clearance')}
                    >
                      Make Your First Request
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Announcements */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Campaign sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Announcements
                  </Typography>
                </Box>

                <List>
                  {announcements.map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={announcement.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {announcement.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(announcement.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < announcements.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ResidentDashboard;