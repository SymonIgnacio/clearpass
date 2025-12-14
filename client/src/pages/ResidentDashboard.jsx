import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Person,
  Description,
  Event,
  Chat,
  AccountCircle,
  Refresh,
  Assignment,
  Gavel,
  LocationOn,
  Phone,
  Email,
  Home,
  Business
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const ResidentDashboard = ({ user }) => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResidentData()
  }, [])

  const fetchResidentData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch resident profile
      const profileResponse = await apiRequest('auth/profile')
      const profileData = await profileResponse.json()
      setProfile(profileData)

      // Fetch resident documents (certificates)
      const documentsResponse = await apiRequest('certificates')
      const documentsData = await documentsResponse.json()
      setDocuments(documentsData || [])

      // Fetch community events
      const eventsResponse = await apiRequest('programs')
      const eventsData = await eventsResponse.json()
      setEvents(eventsData || [])

    } catch (error) {
      console.error('Error fetching resident data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Request Document':
        navigate('/documents')
        break
      case 'Report Incident':
        navigate('/blotter')
        break
      case 'View Events':
        navigate('/events')
        break
      case 'Contact Barangay':
        // Could open a contact modal or navigate to contact page
        break
      default:
        break
    }
  }

  const residentStats = [
    {
      title: 'My Documents',
      value: documents.length,
      subtitle: 'Certificates & Clearances',
      icon: <Description sx={{ fontSize: 32 }} />,
      color: '#1a73e8',
      bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      action: 'View Documents'
    },
    {
      title: 'Community Events',
      value: events.filter(event => event.status === 'Planned' || event.status === 'Ongoing').length,
      subtitle: 'Upcoming Activities',
      icon: <Event sx={{ fontSize: 32 }} />,
      color: '#34a853',
      bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      action: 'View Events'
    },
    {
      title: 'Active Cases',
      value: 0, // Residents shouldn't see blotter statistics
      subtitle: 'No active reports',
      icon: <Gavel sx={{ fontSize: 32 }} />,
      color: '#fbbc04',
      bgColor: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
      action: 'Report Incident'
    },
    {
      title: 'Account Status',
      value: user?.is_active ? 'Active' : 'Pending',
      subtitle: 'Verified Resident',
      icon: <AccountCircle sx={{ fontSize: 32 }} />,
      color: '#34a853',
      bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      action: 'View Profile'
    }
  ]

  const quickActions = [
    {
      icon: <Description />,
      title: 'Request Document',
      description: 'Apply for barangay certificates and clearances',
      color: '#1a73e8',
      action: 'Request Document'
    },
    {
      icon: <Gavel />,
      title: 'Report Incident',
      description: 'File a blotter report for community incidents',
      color: '#ea4335',
      action: 'Report Incident'
    },
    {
      icon: <Event />,
      title: 'Community Events',
      description: 'View upcoming barangay programs and activities',
      color: '#34a853',
      action: 'View Events'
    },
    {
      icon: <Chat />,
      title: 'Contact Barangay',
      description: 'Get help from barangay officials',
      color: '#fbbc04',
      action: 'Contact Barangay'
    }
  ]

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
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      {/* Welcome Header */}
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
              fontWeight: 400,
              mb: 1,
              background: 'linear-gradient(45deg, #1a73e8, #34a853)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Welcome back, {profile?.full_name || user?.full_name || 'Resident'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your personal barangay resident portal
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<Person />}
            label="Resident Account"
            color="success"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchResidentData}
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

      {user?.residency_status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            ⚠️ Residency Verification Required
          </Typography>
          <Typography variant="body2">
            To access document and certificate requests, please verify your barangay residency. Visit Settings to submit your proof of residency.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/settings')}
              sx={{ mr: 1 }}
            >
              Complete Verification
            </Button>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Resident Profile Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'R'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                  {profile?.full_name || user?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Barangay Resident
                </Typography>
                <Chip
                  label={user?.is_active ? 'Verified Account' : 'Account Pending'}
                  color={user?.is_active ? 'success' : 'warning'}
                  size="small"
                  sx={{ borderRadius: 2 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 2 }}>
                Contact Information
              </Typography>

              <List dense>
                {profile?.email && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Email color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={profile.email}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                )}

                {profile?.mobile_number && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Phone color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={profile.mobile_number}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                )}

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Home color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Barangay Batia, Bocaue, Bulacan"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={3}>
            {residentStats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    background: stat.bgColor,
                    border: '1px solid #e8eaed',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}>
                      <Avatar
                        sx={{
                          bgcolor: stat.color,
                          width: 56,
                          height: 56,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: stat.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}
                        >
                          {stat.title}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 600,
                        color: '#202124',
                        mb: 1,
                        fontSize: '2rem'
                      }}
                    >
                      {typeof stat.value === 'string' ? stat.value : stat.value}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        color: '#5f6368',
                        mb: 2
                      }}
                    >
                      {stat.subtitle}
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleQuickAction(stat.action)}
                      sx={{
                        borderColor: stat.color,
                        color: stat.color,
                        '&:hover': {
                          borderColor: stat.color,
                          backgroundColor: `${stat.color}08`
                        }
                      }}
                    >
                      {stat.action}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
                Quick Actions
              </Typography>

              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderColor: '#e8eaed',
                        '&:hover': {
                          borderColor: action.color,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{
                            bgcolor: action.color,
                            width: 40,
                            height: 40,
                            mr: 2
                          }}>
                            {action.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {action.title}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
                Recent Activity
              </Typography>

              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No recent activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your document requests and community interactions will appear here
                </Typography>
              </Box>

              <Box sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(26, 115, 232, 0.04)',
                border: '1px solid rgba(26, 115, 232, 0.12)'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  💡 Need Help?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Use the BANTAY AI chatbot in the bottom right corner for assistance with barangay services and information.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ResidentDashboard
