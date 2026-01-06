import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material'
import { Assessment, People, Elderly, Accessible, FamilyRestroom } from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const Census = () => {
  const [censusData, setCensusData] = useState(null)

  useEffect(() => {
    fetchCensusData()
  }, [])

  const fetchCensusData = async () => {
    try {
      console.log('🚀 Census: Fetching census data...')
      const response = await apiRequest('census')
      console.log('🚀 Census: API response status:', response.status)

      if (response.status === 403) {
        console.error('🚫 Census: Access forbidden - RBAC issue')
        return
      }

      if (!response.ok) {
        console.error('🚫 Census: API error:', response.status, response.statusText)
        return
      }

      const data = await response.json()
      console.log('✅ Census: Data received:', data)
      setCensusData(data)
    } catch (error) {
      console.error('❌ Census: Error fetching census data:', error)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Population Census & Statistics
      </Typography>

      {censusData && censusData.overall && (
        <>
          {/* Overall Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Overall Population
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {censusData.overall.total_residents || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total registered residents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Elderly sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Vulnerable Groups
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="h5" color="warning.main">
                        {censusData.overall.total_seniors || 0}
                      </Typography>
                      <Typography variant="body2">Seniors</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" color="secondary.main">
                        {censusData.overall.total_pwd || 0}
                      </Typography>
                      <Typography variant="body2">PWDs</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" color="info.main">
                        {censusData.overall.total_single_parents || 0}
                      </Typography>
                      <Typography variant="body2">Single Parents</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Per-Sitio Breakdown */}
          {censusData.bySitio && censusData.bySitio.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Population Breakdown by Sitio
                </Typography>

                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sitio</TableCell>
                        <TableCell align="right">Total Residents</TableCell>
                        <TableCell align="right">Seniors</TableCell>
                        <TableCell align="right">PWDs</TableCell>
                        <TableCell align="right">Single Parents</TableCell>
                        <TableCell>Vulnerable %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {censusData.bySitio.map((sitio) => {
                        const vulnerableCount = (sitio.seniors || 0) + (sitio.pwd || 0) + (sitio.single_parents || 0)
                        const vulnerablePercent = sitio.total_residents > 0
                          ? ((vulnerableCount / sitio.total_residents) * 100).toFixed(1)
                          : 0

                        return (
                          <TableRow key={sitio.sitio_name || sitio.Sitio_ID}>
                            <TableCell>
                              <Chip label={sitio.sitio_name || `Sitio ${sitio.Sitio_ID}`} color="primary" size="small" />
                            </TableCell>
                            <TableCell align="right">{sitio.total_residents || 0}</TableCell>
                            <TableCell align="right">{sitio.seniors || 0}</TableCell>
                            <TableCell align="right">{sitio.pwd || 0}</TableCell>
                            <TableCell align="right">{sitio.single_parents || 0}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${vulnerablePercent}%`}
                                color={vulnerablePercent > 20 ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!censusData && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Loading census data...
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default Census
