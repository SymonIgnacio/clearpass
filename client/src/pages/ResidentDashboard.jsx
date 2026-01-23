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
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Description,
  Gavel,
  CheckCircle,
  Pending,
  Error,
  Add,
  Refresh,
  Logout,
  Settings,
  Home,
  CloudUpload,
  Campaign,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../contexts/useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { apiRequest } from '../utils/api';
import { useLocation } from 'react-router-dom';
import VerificationUploadModal from '../components/VerificationUploadModal';

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const { notifications, markAsRead } = useNotifications(); // Access notifications from context
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [stats, setStats] = useState({
    pending_requests: 0,
    completed_requests: 0,
    profile_completion: 0,
  });

  const isGuest = user?.role === 13;
  const isPending = profile?.Residency_Status === 'Pending Verification';

  // Check verification status
  const verificationDoc = profile?.verification_document;
  const hasUploadedVerification = !!verificationDoc;
  const verificationStatus = verificationDoc?.verification_status?.toLowerCase(); // Case insensitive check
  const verificationNotes = verificationDoc?.verification_notes;

  const showVerificationBanner = isGuest || isPending;
  const isVerified = verificationStatus === 'verified' || verificationStatus === 'active';

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      // Redirect if not logged in (though ProtectedRoute should handle this)
      navigate('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile && (isPending || location.state?.showVerification)) {
      // Only auto-open if specifically requested or critically needed
      // setVerificationOpen(true);
    }
  }, [profile, location.state]);

  // Listen for verification notifications to auto-refresh dashboard
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Check if the latest notification is about residency verification
      if (
        (latest.title === 'Residency Verified' ||
          latest.title === 'Document Verified' ||
          latest.title === 'Document Rejected' ||
          latest.title === 'Residency Application Approved') &&
        !latest.is_read
      ) {
        console.log('Refreshing dashboard due to notification:', latest.title);

        // Mark as read to prevent loop
        markAsRead(latest.id);

        fetchDashboardData();
        // Force refresh user session to update role from Guest to Resident
        if (
          latest.title === 'Document Verified' ||
          latest.title === 'Residency Application Approved'
        ) {
          if (refreshUser) {
            refreshUser();
          } else {
            window.location.reload();
          }
        }
      }
    }
  }, [notifications]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch resident profile
      let profileData = { success: false };
      try {
        const profileResponse = await apiRequest('/resident-auth/profile');
        profileData = await profileResponse.json();
      } catch (error) {
        console.error('Failed to fetch profile', error);
        // Fallback only on error
        if (!user.resident_id) {
          profileData = {
            success: true,
            profile: {
              First_Name: user.full_name?.split(' ')[0] || user.username,
              Last_Name: user.full_name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              Residency_Status: 'Pending Verification',
            },
          };
        }
      }

      let currentProfile = null;
      if (profileData.success || profileData.profile) {
        setProfile(profileData.profile || profileData.data); // Handle different response structures
        currentProfile = profileData.profile || profileData.data;
      }

      let allRequests = [];

      // 1. Fetch certificate requests
      if (user.resident_id) {
        try {
          // Use the correct endpoint for request history
          const requestsResponse = await apiRequest('/certificate-requests/my-requests');
          if (requestsResponse.ok) {
            const certs = await requestsResponse.json();
            // The response structure might be { success: true, data: [...] } or just [...]
            const certList = Array.isArray(certs) ? certs : certs.data || [];

            if (Array.isArray(certList)) {
              allRequests.push(
                ...certList.map(r => ({
                  id: r.id || r.request_id,
                  type: 'Certificate Request',
                  title: r.certificate_type || 'Certificate',
                  purpose: r.purpose,
                  status: r.status,
                  created_at: r.created_at,
                  category: 'document',
                }))
              );
            }
          }
        } catch (e) {
          console.warn('Failed to fetch requests', e);
        }
      }

      // 2. Fetch Blotter Requests
      if (user.resident_id) {
        try {
          const blotterResponse = await apiRequest('/blotter-requests/my');
          if (blotterResponse.ok) {
            const blotterData = await blotterResponse.json();
            if (blotterData.success && Array.isArray(blotterData.data)) {
              allRequests.push(
                ...blotterData.data.map(r => ({
                  id: r.id,
                  type: 'Blotter Report',
                  title: r.incident_type
                    ? r.incident_type.replace(/_/g, ' ').toUpperCase()
                    : 'Incident Report',
                  purpose: r.location_sitio,
                  status: r.status === 'pending_review' ? 'Pending' : r.status,
                  created_at: r.created_at,
                  category: 'blotter',
                }))
              );
            }
          }
        } catch (e) {
          console.warn('Failed to fetch blotter requests', e);
        }
      }

      // 3. Fetch Resident Documents (Beneficiary Proofs etc)
      if (user.resident_id) {
        try {
          const docsResponse = await apiRequest(`/residents/${user.resident_id}/documents`);
          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            const docsList = Array.isArray(docsData) ? docsData : docsData.data || [];

            if (Array.isArray(docsList)) {
              allRequests.push(
                ...docsList.map(d => ({
                  id: d.id,
                  type: 'Document Upload',
                  title: d.document_type || d.file_name,
                  purpose: 'Verification',
                  status: d.verification_status,
                  created_at: d.created_at,
                  category: 'verification',
                }))
              );
            }
          }
        } catch (e) {
          console.warn('Failed to fetch documents', e);
        }
      }

      // 4. Inject Residency Verification Status
      if (currentProfile?.verification_document) {
        // Only add if not already covered by documents list (deduplication check)
        // Actually, let's keep it as a distinct "Request" entity for the account activation itself
        const doc = currentProfile.verification_document;
        // Check if this specific document is already in the list to avoid double counting the same file
        const alreadyExists = allRequests.some(
          r => r.category === 'verification' && r.created_at === doc.created_at
        );

        if (!alreadyExists) {
          allRequests.push({
            id: 'verification-request',
            type: 'Residency Verification',
            title: 'Account Verification',
            purpose: 'Account Activation',
            status:
              doc.verification_status === 'pending' ? 'Under Review' : doc.verification_status,
            created_at: doc.created_at,
            category: 'verification',
          });
        }
      } else if (
        currentProfile?.Residency_Status === 'Pending Verification' ||
        currentProfile?.Residency_Status === 'Guest'
      ) {
        allRequests.push({
          id: 'verification-placeholder',
          type: 'Residency Verification',
          title: 'Account Verification',
          purpose: 'Account Activation',
          status: 'Pending Verification',
          created_at: new Date().toISOString(),
          category: 'verification',
        });
      }

      // 5. Inject Beneficiary Claim Status
      // Check if any vulnerability flag is true but validation_status is pending
      if (currentProfile && currentProfile.validation_status === 'pending') {
        allRequests.push({
          id: 'beneficiary-claim',
          type: 'Beneficiary Claim',
          title: 'Social Aid Status',
          purpose: 'Beneficiary Application',
          status: 'Under Review',
          created_at: currentProfile.updated_at || new Date().toISOString(),
          category: 'beneficiary',
        });
      }

      // Sort by date (newest first)
      allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(allRequests.slice(0, 5));

      // Calculate stats
      const normalizeStatus = s => (s ? s.toLowerCase() : '');

      const pendingStatuses = [
        'pending',
        'under review',
        'pending_review',
        'pending upload',
        'pending verification',
      ];
      const completedStatuses = [
        'released',
        'active',
        'verified',
        'approved',
        'resolved',
        'closed',
        'completed',
        'rejected',
      ];

      const pending = allRequests.filter(r => {
        const status = normalizeStatus(r.status);
        // Special case: Pending Verification is only pending if user is not Active
        if (status === 'pending verification' && currentProfile?.Residency_Status === 'Active')
          return false;
        return pendingStatuses.includes(status);
      }).length;

      const completed = allRequests.filter(r => {
        const status = normalizeStatus(r.status);
        // Special case: Pending Verification is completed if user is Active
        if (status === 'pending verification' && currentProfile?.Residency_Status === 'Active')
          return true;
        return completedStatuses.includes(status);
      }).length;

      setStats({
        pending_requests: pending,
        completed_requests: completed,
        profile_completion: currentProfile ? calculateProfileCompletion(currentProfile) : 0,
      });

      // Mock announcements
      setAnnouncements([
        {
          id: 1,
          title: 'New Online Services Available',
          message: 'You can now request certificates and file complaints online.',
          date: new Date().toISOString(),
          type: 'info',
        },
        {
          id: 2,
          title: 'Barangay Assembly Meeting',
          message: 'Monthly assembly meeting scheduled for next week.',
          date: new Date().toISOString(),
          type: 'event',
        },
      ]);

      // Fetch upcoming programs
      try {
        const programsResponse = await apiRequest('/programs', {
          params: { limit: 3, sort: 'upcoming' }, // Assuming backend supports these or we filter client-side
        });
        if (programsResponse.ok) {
          const programsData = await programsResponse.json();
          // Filter for upcoming events only
          const upcoming = (programsData.programs || programsData).filter(
            p => new Date(p.date) >= new Date()
          );
          setPrograms(upcoming.slice(0, 3));
        }
      } catch (e) {
        console.warn('Failed to fetch programs', e);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = profile => {
    if (!profile) return 0;

    const fields = [
      'First_Name',
      'Last_Name',
      'email',
      'Mobile_Number',
      'Birthdate',
      'Gender',
      'Civil_Status',
    ];

    const completed = fields.filter(field => profile[field] && profile[field] !== '').length;
    const percentage = Math.round((completed / fields.length) * 100);

    return percentage;
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'Pending':
        return <Pending color='warning' />;
      case 'Processing':
        return <Pending color='info' />;
      case 'Released':
        return <CheckCircle color='success' />;
      case 'Rejected':
        return <Error color='error' />;
      default:
        return <Pending color='disabled' />;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Processing':
        return 'info';
      case 'Released':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/resident/login');
  };

  if (loading || authLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, width: 200 }} />
          <Typography variant='h6' color='text.secondary'>
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
              <Home sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 600, mb: 0.5 }}>
                Welcome, {profile?.First_Name || 'Resident'}!
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Barangay ClearPass Resident Portal
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Refresh'>
              <IconButton onClick={fetchDashboardData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title='Settings'>
              <IconButton onClick={() => navigate('/resident/profile')}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title='Logout'>
              <IconButton onClick={handleLogout} color='error'>
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ p: 3 }}>
        {showVerificationBanner && (
          <Alert
            severity={
              verificationStatus === 'rejected'
                ? 'error'
                : hasUploadedVerification
                  ? 'info'
                  : 'warning'
            }
            icon={verificationStatus === 'rejected' ? <Error /> : <Info />}
            action={
              !isVerified && (
                <Button color='inherit' size='small' onClick={() => setVerificationOpen(true)}>
                  {verificationStatus === 'rejected'
                    ? 'Upload New Proof'
                    : hasUploadedVerification
                      ? 'View/Update Proof'
                      : 'Upload Proof'}
                </Button>
              )
            }
            sx={{ mb: 3 }}
          >
            <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
              {verificationStatus === 'rejected'
                ? 'Verification Rejected'
                : hasUploadedVerification
                  ? 'Verification Under Review'
                  : 'Verification Required'}
            </Typography>
            {verificationStatus === 'rejected'
              ? `Your proof of residency was rejected. ${verificationNotes ? `Reason: ${verificationNotes}` : 'Please upload a valid document.'}`
              : hasUploadedVerification
                ? 'Your proof of residency has been submitted and is currently being reviewed by the barangay.'
                : 'Your account is currently under review. Please upload a valid proof of residency to unlock full features.'}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Profile Summary
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                    }}
                  >
                    {profile?.First_Name?.charAt(0)}
                    {profile?.Last_Name?.charAt(0)}
                  </Avatar>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {profile?.First_Name} {profile?.Last_Name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {profile?.email}
                  </Typography>
                  <Chip
                    label={profile?.Residency_Status || 'Pending Verification'}
                    color={profile?.Residency_Status === 'Active' ? 'success' : 'warning'}
                    size='small'
                    sx={{ mt: 1 }}
                  />
                </Box>

                {stats.profile_completion < 100 && (
                  <Alert severity='info' sx={{ mb: 2 }}>
                    Complete your profile to access all features.
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant='outlined'
                  onClick={() => navigate('/resident/profile')}
                  disabled={isGuest || isPending}
                  sx={{ borderRadius: 2 }}
                >
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats - REMOVED */}
          <Grid item xs={12} md={8}>
            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant='contained'
                      startIcon={<Description />}
                      onClick={() => navigate('/resident/request-certificate')}
                      disabled={showVerificationBanner}
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Request Certificate
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant='outlined'
                      startIcon={<Gavel />}
                      onClick={() => navigate('/resident/blotter-report')}
                      disabled={showVerificationBanner}
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      File Complaint
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Left Column: Recent Requests */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Recent Requests
                  </Typography>
                  <Button
                    size='small'
                    onClick={() => navigate('/resident/requests')}
                    disabled={showVerificationBanner}
                  >
                    View All
                  </Button>
                </Box>

                {requests.length > 0 ? (
                  <List>
                    {requests.map((request, index) => (
                      <React.Fragment key={request.id || index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>{getStatusIcon(request.status)}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant='body1'
                                  component='span'
                                  sx={{ fontWeight: 500 }}
                                >
                                  {request.title || request.certificate_type || 'Request'}
                                </Typography>
                                {request.type === 'Blotter Report' && (
                                  <Chip
                                    label='Complaint'
                                    size='small'
                                    color='error'
                                    variant='outlined'
                                    sx={{ height: 20, fontSize: '0.625rem' }}
                                  />
                                )}
                                {request.type === 'Beneficiary Claim' && (
                                  <Chip
                                    label='Beneficiary'
                                    size='small'
                                    color='info'
                                    variant='outlined'
                                    sx={{ height: 20, fontSize: '0.625rem' }}
                                  />
                                )}
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box sx={{ display: 'block' }}>
                                <Typography variant='body2' color='text.secondary' component='div'>
                                  {request.purpose || 'General Purpose'}
                                </Typography>
                                {request.created_at && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    component='div'
                                    sx={{ display: 'block' }}
                                  >
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </Typography>
                                )}
                                <Chip
                                  label={request.status || 'Pending'}
                                  color={getStatusColor(request.status)}
                                  size='small'
                                  sx={{ mt: 0.5, display: 'flex', width: 'fit-content' }}
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
                    <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
                      No requests yet
                    </Typography>
                    {!showVerificationBanner && (
                      <Button
                        variant='contained'
                        startIcon={<Add />}
                        onClick={() => navigate('/resident/request-certificate')}
                      >
                        Make Your First Request
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Community Programs */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Community Programs
                  </Typography>
                  <Button size='small' onClick={() => navigate('/resident/programs')}>
                    View All
                  </Button>
                </Box>

                {programs.length > 0 ? (
                  <List>
                    {programs.map((program, index) => (
                      <React.Fragment key={program.id}>
                        <ListItem alignItems='flex-start' sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                {program.title}
                              </Typography>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography
                                  sx={{ display: 'block', mb: 0.5 }}
                                  component='span'
                                  variant='body2'
                                  color='text.primary'
                                >
                                  {new Date(program.date).toLocaleDateString()} • {program.location}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {program.description?.substring(0, 60)}...
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {index < programs.length - 1 && <Divider component='li' />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Campaign sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant='body2' color='text.secondary'>
                      No upcoming programs
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Verification Modal */}
      <VerificationUploadModal
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onSuccess={() => {
          fetchDashboardData(); // Refresh data to potentially update status
        }}
      />
    </Box>
  );
};

export default ResidentDashboard;
