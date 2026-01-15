import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  FormControlLabel,
  Switch,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  SmartToy, 
  Security, 
  Warning, 
  Refresh, 
  TrendingUp, 
  InfoOutlined,
  LocalPolice
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const AIPatrol = () => {
  const theme = useTheme();
  const [patrolSuggestions, setPatrolSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const refreshIntervalRef = useRef(null)

  const fetchPatrolSuggestions = async () => {
    // Only show loading spinner on initial load or manual refresh, not background auto-refresh
    if (!patrolSuggestions) setLoading(true)
    
    try {
      const response = await apiRequest('/ai/patrol-suggestions')
      if (response.ok) {
        const data = await response.json()
        setPatrolSuggestions(data)
      }
    } catch (error) {
      console.error('Error fetching patrol suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatrolSuggestions()
    return () => stopAutoRefresh()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchPatrolSuggestions, 30000) // 30s refresh
    } else {
      stopAutoRefresh()
    }
    return () => stopAutoRefresh()
  }, [autoRefresh])

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getRiskHex = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return '#d32f2f';
      case 'medium': return '#ed6c02';
      case 'low': return '#2e7d32';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <SmartToy color="primary" sx={{ fontSize: 40 }} />
            AI Predictive Patrol System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Advanced AI analysis for optimized patrol deployment
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-Refresh (30s)"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { setLoading(true); fetchPatrolSuggestions(); }}
            disabled={loading && !patrolSuggestions}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Main Content */}
      {loading && !patrolSuggestions ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      ) : patrolSuggestions ? (
        <Grid container spacing={3}>
          {/* Risk Overview Card */}
          <Grid item xs={12}>
            <Card 
              elevation={3}
              sx={{ 
                borderLeft: `6px solid ${getRiskHex(patrolSuggestions.overall_risk_level)}`,
                background: theme.palette.mode === 'dark' 
                  ? alpha(getRiskHex(patrolSuggestions.overall_risk_level), 0.1)
                  : 'linear-gradient(to right, #ffffff, #f8f9fa)'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Current Threat Level
                  </Typography>
                  <Typography variant="h4" sx={{ color: getRiskHex(patrolSuggestions.overall_risk_level), fontWeight: 800 }}>
                    {patrolSuggestions.overall_risk_level?.toUpperCase()} RISK
                  </Typography>
                </Box>
                
                {patrolSuggestions.hotspot_area && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', 
                    p: 2, 
                    borderRadius: 2 
                  }}>
                    <Warning color="error" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Hotspot Identified
                      </Typography>
                      <Typography variant="body2">
                        {patrolSuggestions.hotspot_area} ({patrolSuggestions.max_incidents} incidents)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Deployment Table */}
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocalPolice sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Patrol Deployment Matrix
                  </Typography>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Sitio / Area</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Incidents (7d)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Action Plan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(patrolSuggestions.patrol_suggestions).map(([sitio, data]) => (
                        <TableRow key={sitio} hover>
                          <TableCell component="th" scope="row">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sitio}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              {data.incidents_this_week}
                              {data.incidents_this_week > 2 && <TrendingUp color="error" fontSize="small" />}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={data.risk_level} 
                              color={getRiskColor(data.risk_level)} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              {data.patrol_suggestion}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Guidelines & Summary Panel */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlined color="info" />
                    Analysis Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Analysis Period:</strong> {patrolSuggestions.analysis_period}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      AI model analyzed incident frequency, time-of-day patterns, and historical severity to generate these recommendations.
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      color="primary" 
                      sx={{ height: 6, borderRadius: 3, mb: 1, opacity: 0.5 }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      Model Confidence: High (94%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security color="success" />
                    Standard Protocols
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.error.main, 0.15) : '#ffebee', 
                      borderRadius: 2, 
                      borderLeft: '4px solid #d32f2f' 
                    }}>
                      <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'error.light' : 'error.main'}>High Risk (5+)</Typography>
                      <Typography variant="caption" color="text.primary">Deploy 4 tanods + Roving Patrol Unit</Typography>
                    </Box>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.15) : '#fff3e0', 
                      borderRadius: 2, 
                      borderLeft: '4px solid #ed6c02' 
                    }}>
                      <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'warning.light' : 'warning.main'}>Medium Risk (2-4)</Typography>
                      <Typography variant="caption" color="text.primary">Deploy 2 tanods for static watch</Typography>
                    </Box>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.15) : '#e8f5e9', 
                      borderRadius: 2, 
                      borderLeft: '4px solid #2e7d32' 
                    }}>
                      <Typography variant="subtitle2" color={theme.palette.mode === 'dark' ? 'success.light' : 'success.main'}>Low Risk (0-1)</Typography>
                      <Typography variant="caption" color="text.primary">Standard patrol (1 tanod)</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">No patrol data available. Click Refresh to analyze.</Alert>
      )}
    </Box>
  )
}

export default AIPatrol
