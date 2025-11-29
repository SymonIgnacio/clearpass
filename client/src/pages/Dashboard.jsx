import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  People,
  Gavel,
  Description,
  SmartToy,
  Security,
  Warning,
  TrendingUp,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Analytics,
  Shield,
  Assignment,
  Group
} from '@mui/icons-material'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [blotterCases, setBlotterCases] = useState([])
  const [patrolSuggestions, setPatrolSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patrolLoading, setPatrolLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchCertificates()
    fetchBlotterCases()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/census')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates')
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }
  }

  const fetchBlotterCases = async () => {
    try {
      const response = await fetch('/api/blotter')
      if (response.ok) {
        const data = await response.json()
        setBlotterCases(data)
      }
    } catch (error) {
      console.error('Error fetching blotter cases:', error)
    }
  }

  const fetchPatrolSuggestions = async () => {
    setPatrolLoading(true)
    try {
      const response = await fetch('/api/ai/patrol-suggestions')
      if (response.ok) {
        const data = await response.json()
        setPatrolSuggestions(data)
      }
    } catch (error) {
      console.error('Error fetching patrol suggestions:', error)
    } finally {
      setPatrolLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Population',
      value: stats?.overall?.total_residents || 0,
      subtitle: 'Registered Residents',
      icon: <People sx={{ fontSize: 32 }} />,
      color: '#1a73e8',
      bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      trend: '+12%',
      trendLabel: 'vs last month'
    },
    {
      title: 'Active Cases',
      value: blotterCases.filter(case_ => case_.status === 'Pending').length,
      subtitle: 'Ongoing Investigations',
      icon: <Gavel sx={{ fontSize: 32 }} />,
      color: '#ea4335',
      bgColor: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      trend: '-8%',
      trendLabel: 'resolution rate'
    },
    {
      title: 'Certificates Issued',
      value: certificates.length,
      subtitle: 'Total Certificates',
      icon: <Description sx={{ fontSize: 32 }} />,
      color: '#34a853',
      bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      trend: '+15%',
      trendLabel: 'vs last month'
    },
    {
      title: 'Vulnerable Groups',
      value: (stats?.overall?.total_seniors || 0) + (stats?.overall?.total_pwd || 0) + (stats?.overall?.total_single_parents || 0),
      subtitle: 'Seniors, PWD, Single Parents',
      icon: <Security sx={{ fontSize: 32 }} />,
      color: '#fbbc04',
      bgColor: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
      trend: '+5%',
      trendLabel: 'support programs'
    }
  ]

  const getRiskIcon = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return <Error sx={{ color: '#ea4335' }} />
      case 'MEDIUM':
      case 'ELEVATED':
        return <Warning sx={{ color: '#fbbc04' }} />
      default:
        return <CheckCircle sx={{ color: '#34a853' }} />
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return '#ea4335'
      case 'MEDIUM':
      case 'ELEVATED':
        return '#fbbc04'
      default:
        return '#34a853'
    }
  }

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
            Loading Barangay Dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header Section */}
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
            Barangay Command Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time overview of barangay operations and community insights
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<Shield />}
            label="System Online"
            color="success"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchStats}
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: card.bgColor,
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
                      bgcolor: card.color,
                      width: 56,
                      height: 56,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: card.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      {card.trend}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.trendLabel}
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
                  {card.value}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: '#5f6368',
                    mb: 1
                  }}
                >
                  {card.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* AI Command Center */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{
                    bgcolor: '#1a73e8',
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <SmartToy sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
                      AI Patrol Intelligence
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Machine learning-powered security recommendations
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label="AI Powered"
                  color="primary"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                />
              </Box>

              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Advanced analytics of incident patterns, temporal trends, and risk factors to optimize patrol deployment and community safety.
              </Typography>

              <Button
                variant="contained"
                startIcon={patrolLoading ? <CircularProgress size={20} /> : <Analytics />}
                onClick={fetchPatrolSuggestions}
                disabled={patrolLoading}
                sx={{
                  mb: 3,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {patrolLoading ? 'Analyzing Patterns...' : 'Generate Intelligence Report'}
              </Button>

              {patrolSuggestions && (
                <Box>
                  <Alert
                    severity={
                      patrolSuggestions.overall_risk_assessment === 'CRITICAL' ? 'error' :
                      patrolSuggestions.overall_risk_assessment === 'HIGH' ? 'error' :
                      patrolSuggestions.overall_risk_assessment === 'MEDIUM' ? 'warning' :
                      'success'
                    }
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': { fontSize: '1.5rem' }
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                      {patrolSuggestions.overall_risk_assessment} Risk Level
                    </Typography>
                    <Typography variant="body2">
                      Confidence: {Math.round(patrolSuggestions.confidence_score * 100)}% •
                      Max Incidents: {patrolSuggestions.max_risk_score}
                    </Typography>
                  </Alert>

                  <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                    Strategic Recommendations
                  </Typography>

                  <Grid container spacing={2}>
                    {patrolSuggestions.recommendations.slice(0, 3).map((rec, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Card variant="outlined" sx={{
                          borderRadius: 2,
                          borderColor: '#e8eaed'
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                              Priority {index + 1}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {rec}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
                Quick Actions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: <People />, label: 'Register Resident', color: '#1a73e8' },
                  { icon: <Gavel />, label: 'Report Incident', color: '#ea4335' },
                  { icon: <Description />, label: 'Issue Certificate', color: '#34a853' },
                  { icon: <SmartToy />, label: 'AI Analysis', color: '#fbbc04' },
                  { icon: <Group />, label: 'Community Events', color: '#9c27b0' }
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={action.icon}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      borderColor: '#e8eaed',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: action.color,
                        backgroundColor: `${action.color}08`,
                        transform: 'translateX(4px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>

              <Box sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(26, 115, 232, 0.04)',
                border: '1px solid rgba(26, 115, 232, 0.12)'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  💡 Pro Tip
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Use AI Patrol Intelligence for data-driven security decisions and optimal resource allocation.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
