import React, { useState, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import { SmartToy, Security, Warning } from '@mui/icons-material';

const AIPatrol = () => {
  const [patrolSuggestions, setPatrolSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchPatrolSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/ai/patrol-suggestions`)
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
  }, [])

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Predictive Patrol System
      </Typography>

      <Typography paragraph sx={{ mb: 4 }}>
        Advanced AI analysis of blotter data to optimize tanod patrol deployment and enhance community safety.
        The system analyzes incident patterns, risk levels, and historical data to provide intelligent patrol recommendations.
      </Typography>

      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} /> : <SmartToy />}
        onClick={fetchPatrolSuggestions}
        disabled={loading}
        sx={{ mb: 4 }}
      >
        {loading ? 'Analyzing...' : 'Refresh AI Analysis'}
      </Button>

      {patrolSuggestions && (
        <>
          {/* Overall Risk Assessment */}
          <Alert
            severity={
              patrolSuggestions.overall_risk_level === 'High' ? 'error' :
              patrolSuggestions.overall_risk_level === 'Medium' ? 'warning' : 'success'
            }
            sx={{ mb: 4 }}
          >
            <Typography variant="h6">
              Current Risk Level: {patrolSuggestions.overall_risk_level}
            </Typography>
            {patrolSuggestions.hotspot_area && (
              <Typography>
                Hotspot Area Identified: <strong>{patrolSuggestions.hotspot_area}</strong>
                ({patrolSuggestions.max_incidents} incidents this week)
              </Typography>
            )}
          </Alert>

          {/* Patrol Recommendations */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recommended Patrol Deployment
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sitio</TableCell>
                      <TableCell align="right">Incidents (Week)</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Patrol Recommendation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(patrolSuggestions.patrol_suggestions).map(([sitio, data]) => (
                      <TableRow key={sitio}>
                        <TableCell>
                          <Chip label={sitio} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="right">{data.incidents_this_week}</TableCell>
                        <TableCell>
                          <Chip
                            label={data.risk_level}
                            color={
                              data.risk_level === 'High' ? 'error' :
                              data.risk_level === 'Medium' ? 'warning' : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
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

          {/* AI Insights */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Analysis Summary
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Analysis Period: {patrolSuggestions.analysis_period}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Total incidents analyzed: Recent blotter records from the past 7 days
                  </Typography>
                  <Typography variant="body2">
                    Risk assessment based on incident frequency and severity patterns across all sitios.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Patrol Guidelines
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>High Risk (5+ incidents):</strong> Deploy 4 tanods + roving patrol
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Medium Risk (2-4 incidents):</strong> Deploy 2 tanods
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Low Risk (0-1 incidents):</strong> Standard patrol (1 tanod)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default AIPatrol
