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

const Census = () => {
  const [censusData, setCensusData] = useState(null)

  useEffect(() => {
    fetchCensusData()
  }, [])

  const fetchCensusData = async () => {
    try {
      const response = await fetch('/api/census')
      if (response.ok) {
        const data = await response.json()
        setCensusData(data)
      }
    } catch (error) {
      console.error('Error fetching census data:', error)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Population Census & Statistics
      </Typography>

      {censusData && (
        <>
          {/* Overall Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Overall Population
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {censusData.overall.total_residents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total registered residents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Elderly sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Vulnerable Groups
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="h5" color="warning.main">
                        {censusData.overall.total_seniors}
                      </Typography>
                      <Typography variant="body2">Seniors</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" color="secondary.main">
                        {censusData.overall.total_pwd}
                      </Typography>
                      <Typography variant="body2">PWDs</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" color="info.main">
                        {censusData.overall.total_single_parents}
                      </Typography>
                      <Typography variant="body2">Single Parents</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Per-Sitio Breakdown */}
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
                      const vulnerableCount = sitio.seniors + sitio.pwd + sitio.single_parents
                      const vulnerablePercent = sitio.total_residents > 0
                        ? ((vulnerableCount / sitio.total_residents) * 100).toFixed(1)
                        : 0

                      return (
                        <TableRow key={sitio.sitio_name}>
                          <TableCell>
                            <Chip label={sitio.sitio_name} color="primary" size="small" />
                          </TableCell>
                          <TableCell align="right">{sitio.total_residents}</TableCell>
                          <TableCell align="right">{sitio.seniors}</TableCell>
                          <TableCell align="right">{sitio.pwd}</TableCell>
                          <TableCell align="right">{sitio.single_parents}</TableCell>
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
        </>
      )}
    </Box>
  )
}

export default Census
