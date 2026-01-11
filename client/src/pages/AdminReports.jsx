import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from '@mui/material'
import {
  People,
  Gavel,
  Description,
  Security,
  Assessment,
  Refresh,
  Download,
  TrendingUp,
  Person,
  Business,
  Warning
} from '@mui/icons-material'
import { api, apiRequest } from '../utils/api'

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [reports, setReports] = useState({
    users: null,
    blotter: null,
    certificates: null,
    residents: null,
    system: null,
    security: null
  })
  const [detailedFilters, setDetailedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    role: '',
    search: '',
    page: 1,
    limit: 50
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const tabs = [
    { label: 'User Reports', icon: <People />, key: 'users' },
    { label: 'Blotter Reports', icon: <Gavel />, key: 'blotter' },
    { label: 'Certificate Reports', icon: <Description />, key: 'certificates' },
    { label: 'Resident Reports', icon: <Person />, key: 'residents' },
    { label: 'System Health', icon: <Assessment />, key: 'system' },
    { label: 'Security Audit', icon: <Security />, key: 'security' }
  ]

  const loadReport = async (reportKey) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/reports/${reportKey}`)
      setReports(prev => ({
        ...prev,
        [reportKey]: response
      }))
    } catch (err) {
      setError(`Failed to load ${reportKey} report: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async (reportType) => {
    try {
      setLoading(true)

      // Create params object for apiRequest
      const queryParams = {};

      // Add common filters
      if (detailedFilters.dateFrom) queryParams.dateFrom = detailedFilters.dateFrom;
      if (detailedFilters.dateTo) queryParams.dateTo = detailedFilters.dateTo;
      if (detailedFilters.status) queryParams.status = detailedFilters.status;
      if (detailedFilters.search) queryParams.search = detailedFilters.search;

      // Add report-specific filters
      switch (reportType) {
        case 'users':
          if (detailedFilters.role) queryParams.role = detailedFilters.role;
          break;
        case 'residents':
          // Residents might have additional filters
          break;
        case 'certificates':
          // Certificates might have additional filters
          break;
        case 'blotter':
          // Blotter might have additional filters
          break;
      }

      // Call the PDF export endpoint using apiRequest
      const response = await apiRequest(`/admin/reports/pdf/${reportType}`, {
        method: 'GET',
        params: queryParams
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`)
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} PDF report downloaded successfully!`)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert(`Failed to generate PDF: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadAllReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const reportPromises = tabs.map(tab =>
        api.get(`/admin/reports/${tab.key}`)
      )

      const results = await Promise.allSettled(reportPromises)

      const newReports = {}
      results.forEach((result, index) => {
        const tabKey = tabs[index].key
        if (result.status === 'fulfilled') {
          // Successfully loaded report
          newReports[tabKey] = result.value
        } else {
          // Report failed to load - set to null and log error
          console.error(`Failed to load ${tabKey} report:`, result.reason)
          newReports[tabKey] = null
        }
      })

      setReports(newReports)
    } catch (err) {
      // This catch block should rarely be hit with Promise.allSettled
      console.error('Unexpected error in loadAllReports:', err)
      setError(`Failed to load reports: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllReports()
  }, [])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const [detailedData, setDetailedData] = useState(null)
  const [detailedLoading, setDetailedLoading] = useState(false)

  const loadDetailedReport = async (reportType) => {
    setDetailedLoading(true)
    try {
      const queryParams = {
        page: detailedFilters.page,
        limit: detailedFilters.limit,
        ...detailedFilters
      }
      
      const response = await api.get(`/admin/reports/detailed/${reportType}`, { params: queryParams })
      if (response.ok) {
        const data = await response.json()
        setDetailedData(data)
      } else {
        console.error(`Failed to load detailed ${reportType} report: Status ${response.status}`)
      }
    } catch (err) {
      console.error(`Failed to load detailed ${reportType} report:`, err)
    } finally {
      setDetailedLoading(false)
    }
  }

  useEffect(() => {
    // Load detailed report when tab changes or filters change
    const currentTabKey = tabs[activeTab]?.key
    if (currentTabKey && ['users', 'blotter', 'certificates', 'residents'].includes(currentTabKey)) {
      loadDetailedReport(currentTabKey)
    }
  }, [activeTab, detailedFilters.page, detailedFilters.dateFrom, detailedFilters.dateTo, detailedFilters.status, detailedFilters.role, detailedFilters.search])

  const handleFilterChange = (field, value) => {
    setDetailedFilters(prev => ({ ...prev, [field]: value, page: 1 }))
  }

  const renderDetailedTable = () => {
    if (detailedLoading) return <LinearProgress />
    if (!detailedData || !detailedData.data) return <Typography color="textSecondary">No detailed data available</Typography>

    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Detailed Records</Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date From"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={detailedFilters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date To"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={detailedFilters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              size="small"
            />
          </Grid>
          
          {tabs[activeTab].key === 'users' && (
             <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={detailedFilters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="1">IT Admin</MenuItem>
                  <MenuItem value="2">Captain</MenuItem>
                  <MenuItem value="3">Secretary</MenuItem>
                  <MenuItem value="4">Clerk</MenuItem>
                  <MenuItem value="6">Blotter Officer</MenuItem>
                  <MenuItem value="12">Resident</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={tabs[activeTab].key === 'users' ? 2 : 3}>
             <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={detailedFilters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  {/* Add specific status options for other tabs if needed */}
                </Select>
              </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={tabs[activeTab].key === 'users' ? 2 : 3}>
            <TextField
              label="Search"
              fullWidth
              value={detailedFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
              placeholder="Search..."
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                {detailedData.columns.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {detailedData.data.length > 0 ? (
                detailedData.data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {/* Basic rendering - can be enhanced for chips/status */}
                        {cell} 
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={detailedData.columns.length} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination 
            count={detailedData.pagination.pages} 
            page={detailedData.pagination.page} 
            onChange={(e, p) => setDetailedFilters(prev => ({ ...prev, page: p }))} 
            color="primary" 
          />
        </Box>
      </Box>
    )
  }

  const renderUserReports = () => {
    const data = reports.users
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.user_statistics) {
      return <Alert severity="error">User statistics data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* User Statistics Cards */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>User Statistics</Typography>
        </Grid>

        {[
          { label: 'Total Users', value: data.user_statistics.total_users, color: 'primary' },
          { label: 'Active Users', value: data.user_statistics.active_users, color: 'success' },
          { label: 'IT Admins', value: data.user_statistics.it_admins, color: 'error' },
          { label: 'Clerks', value: data.user_statistics.clerks, color: 'info' },
          { label: 'Blotter Officers', value: data.user_statistics.blotter_officers, color: 'warning' },
          { label: 'Captains', value: data.user_statistics.captains, color: 'secondary' },
          { label: 'Secretaries', value: data.user_statistics.secretaries, color: 'success' },
          { label: 'Residents', value: data.user_statistics.residents, color: 'default' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Login Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Login Statistics (30 days)</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Total Attempts:</Typography>
                <Typography variant="h6">{data.login_statistics.total_attempts}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Successful:</Typography>
                <Typography variant="h6" color="success.main">{data.login_statistics.successful_logins}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Failed:</Typography>
                <Typography variant="h6" color="error.main">{data.login_statistics.failed_logins}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent User Activity</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recent_users.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={
                              user.role === 1 ? 'error' :
                              user.role === 2 ? 'info' :
                              user.role === 3 ? 'warning' :
                              user.role === 4 ? 'default' :
                              user.role === 5 ? 'secondary' : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                      </TableRow>
                    ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
</Grid>

        {/* PDF Export */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Export User Reports</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Generate filtered PDF reports of user data
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => generatePDF('users')}
                disabled={loading}
              >
                Export Users PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderBlotterReports = () => {
    const data = reports.blotter
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.blotter_statistics) {
      return <Alert severity="error">Blotter statistics data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* Blotter Statistics */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>Blotter Case Statistics</Typography>
        </Grid>

        {[
          { label: 'Total Cases', value: data.blotter_statistics.total_cases, color: 'primary' },
          { label: 'Active Cases', value: data.blotter_statistics.active_cases, color: 'error' },
          { label: 'Resolved Cases', value: data.blotter_statistics.resolved_cases, color: 'success' },
          { label: 'Pending Cases', value: data.blotter_statistics.pending_cases, color: 'warning' },
          { label: 'Unique Respondents', value: data.blotter_statistics.unique_respondents, color: 'info' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Monthly Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Case Trends (12 months)</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Cases</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.monthly_trends.slice(0, 6).map((trend, index) => (
                      <TableRow key={index}>
                        <TableCell>{trend.year}-{String(trend.month).padStart(2, '0')}</TableCell>
                        <TableCell align="right">{trend.cases_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Incident Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Incident Types Breakdown</Typography>
              {data.incident_types.map((type, index) => (
                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{type.Incident_Type || 'Unknown'}</Typography>
                  <Chip label={type.count} size="small" color="primary" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Locations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Most Active Locations</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {data.active_locations.map((location, index) => (
                  <Chip
                    key={index}
                    label={`${location.Location_Sitio}: ${location.incidents} incidents`}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* PDF Export */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Export Blotter Reports</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Generate filtered PDF reports of blotter case data
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => generatePDF('blotter')}
                disabled={loading}
              >
                Export Blotter PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderCertificateReports = () => {
    const data = reports.certificates
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.certificate_statistics) {
      return <Alert severity="error">Certificate statistics data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* Certificate Statistics */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>Certificate Issuance Statistics</Typography>
        </Grid>

        {[
          { label: 'Total Certificates', value: data.certificate_statistics.total_certificates, color: 'primary' },
          { label: 'Unique Recipients', value: data.certificate_statistics.unique_recipients, color: 'info' },
          { label: 'Barangay Clearances', value: data.certificate_statistics.barangay_clearances, color: 'success' },
          { label: 'Certificate of Indigency', value: data.certificate_statistics.indigency_certificates, color: 'warning' },
          { label: 'Business Permits', value: data.certificate_statistics.business_permits, color: 'secondary' },
          { label: 'Good Moral Certificates', value: data.certificate_statistics.good_moral_certificates, color: 'default' },
          { label: 'Released', value: data.certificate_statistics.released_certificates, color: 'success' },
          { label: 'Pending', value: data.certificate_statistics.pending_certificates, color: 'warning' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h5" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Monthly Issuance Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Issuance Trends</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Certificates</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.monthly_issuance.slice(0, 6).map((trend, index) => (
                      <TableRow key={index}>
                        <TableCell>{trend.year}-{String(trend.month).padStart(2, '0')}</TableCell>
                        <TableCell align="right">{trend.certificates_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Issuers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Certificate Issuers</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Issuer</TableCell>
                      <TableCell align="right">Certificates Issued</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.top_issuers.map((issuer, index) => (
                      <TableRow key={index}>
                        <TableCell>{issuer.full_name || `User ${issuer.issued_by}`}</TableCell>
                        <TableCell align="right">{issuer.issued_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PDF Export */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Export Certificate Reports</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Generate filtered PDF reports of certificate data
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => generatePDF('certificates')}
                disabled={loading}
              >
                Export Certificates PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
           {renderDetailedTable()}
        </Grid>
      </Grid>
    )
  }

  const renderResidentReports = () => {
    const data = reports.residents
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.resident_statistics) {
      return <Alert severity="error">Resident statistics data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* Resident Statistics */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>Resident Population Statistics</Typography>
        </Grid>

        {[
          { label: 'Total Residents', value: data.resident_statistics.total_residents, color: 'primary' },
          { label: 'Active Residents', value: data.resident_statistics.active_residents, color: 'success' },
          { label: 'Transferred Out', value: data.resident_statistics.transferred_residents, color: 'warning' },
          { label: 'Male Residents', value: data.resident_statistics.male_residents, color: 'info' },
          { label: 'Female Residents', value: data.resident_statistics.female_residents, color: 'secondary' },
          { label: 'Total Households', value: data.resident_statistics.total_households, color: 'default' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={2} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Age Demographics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Age Demographics</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Minors (0-17):</Typography>
                <Typography variant="h6" color="info.main">{data.age_demographics.minors}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Adults (18-59):</Typography>
                <Typography variant="h6" color="primary.main">{data.age_demographics.adults}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Seniors (60+):</Typography>
                <Typography variant="h6" color="warning.main">{data.age_demographics.seniors}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Residency Verification</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Verified:</Typography>
                <Typography variant="h6" color="success.main">{data.verification_status.verified_residents}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Pending:</Typography>
                <Typography variant="h6" color="warning.main">{data.verification_status.pending_verification}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Unverified:</Typography>
                <Typography variant="h6" color="error.main">{data.verification_status.unverified_residents}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sitio Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sitio Distribution</Typography>
              {data.sitio_distribution.slice(0, 5).map((sitio, index) => (
                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{sitio.sitio_name}</Typography>
                  <Chip label={sitio.resident_count} size="small" color="primary" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* PDF Export */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Export Resident Reports</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Generate filtered PDF reports of resident data
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => generatePDF('residents')}
                disabled={loading}
              >
                Export Residents PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderSystemReports = () => {
    const data = reports.system
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.system_info) {
      return <Alert severity="error">System information data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* System Information */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>System Health & Information</Typography>
        </Grid>

        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Information</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Node Version:</Typography>
                <Typography>{data.system_info.node_version}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Platform:</Typography>
                <Typography>{data.system_info.platform}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Architecture:</Typography>
                <Typography>{data.system_info.architecture}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Environment:</Typography>
                <Typography>{data.system_info.environment}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Uptime:</Typography>
                <Typography>{Math.floor(data.system_info.uptime / 3600)}h {Math.floor((data.system_info.uptime % 3600) / 60)}m</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Memory Usage</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>RSS:</Typography>
                <Typography>{Math.round(data.system_info.memory_usage.rss / 1024 / 1024)} MB</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Heap Used:</Typography>
                <Typography>{Math.round(data.system_info.memory_usage.heapUsed / 1024 / 1024)} MB</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Heap Total:</Typography>
                <Typography>{Math.round(data.system_info.memory_usage.heapTotal / 1024 / 1024)} MB</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>External:</Typography>
                <Typography>{Math.round(data.system_info.memory_usage.external / 1024 / 1024)} MB</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Database Health Check</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Status: <Chip label={data.database_health.status} color="success" size="small" />
              </Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Table</TableCell>
                      <TableCell align="right">Records</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.database_health.tables.map((table, index) => (
                      <TableRow key={index}>
                        <TableCell>{table.table_name}</TableCell>
                        <TableCell align="right">{table.record_count}</TableCell>
                        <TableCell>
                          <Chip
                            label={table.status}
                            size="small"
                            color={table.status === 'accessible' ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* API Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>API Endpoints Health</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(data.api_health).map(([endpoint, status]) => (
                  <Chip
                    key={endpoint}
                    label={`${endpoint}: ${status}`}
                    color={status === 'operational' ? 'success' : 'error'}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderSecurityReports = () => {
    const data = reports.security
    if (!data) return <CircularProgress />

    // Add null checks for data structure
    if (!data.security_overview) {
      return <Alert severity="error">Security overview data is not available</Alert>
    }

    return (
      <Grid container spacing={3}>
        {/* Security Overview */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>Security Audit & Monitoring</Typography>
        </Grid>

        {/* Security Statistics */}
        {[
          { label: 'Total Login Attempts (30d)', value: data.security_overview.total_attempts_30d, color: 'primary' },
          { label: 'Failed Login Attempts (30d)', value: data.security_overview.failed_attempts_30d, color: 'error' },
          { label: 'Unique Users Attempted', value: data.security_overview.unique_users_attempted, color: 'info' },
          { label: 'Unique IP Addresses', value: data.security_overview.unique_ips, color: 'warning' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" component="div" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* THEMIS ClearPass Security */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>THEMIS ClearPass Security</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Total Blotter Cases:</Typography>
                <Typography variant="h6">{data.clearpass_security.total_blotter_cases}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Cases with Residents:</Typography>
                <Typography variant="h6" color="warning.main">{data.clearpass_security.cases_with_residents}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Active Blocks:</Typography>
                <Typography variant="h6" color="error.main">{data.clearpass_security.active_blocks}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Failed Login Sources */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Failed Login Sources</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell align="right">Attempts</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.failed_login_sources.map((source, index) => (
                      <TableRow key={index}>
                        <TableCell>{source.username}</TableCell>
                        <TableCell>{source.ip_address}</TableCell>
                        <TableCell align="right">
                          <Chip label={source.attempts} size="small" color="error" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Events */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Security Events</Typography>
              {data.security_events.map((event, index) => (
                <Alert
                  key={index}
                  severity={
                    event.severity === 'high' ? 'error' :
                    event.severity === 'medium' ? 'warning' : 'info'
                  }
                  sx={{ mb: 1 }}
                  icon={event.severity === 'high' ? <Warning /> : undefined}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{event.event}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(event.timestamp)}
                    </Typography>
                  </Box>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  // Show full loading screen during initial load
  if (loading && !reports.users) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
          }}
        >
          <CircularProgress size={64} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Loading Reports Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Fetching system analytics and report data...<br />
            This may take a few moments.
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              IT Admin Reports Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive system monitoring and analytics for IT administrators
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => generatePDF(tabs[activeTab]?.key)}
              disabled={loading}
            >
              Export Current Tab PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadAllReports}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh All'}
            </Button>
          </Box>
        </Box>

        {/* Loading Progress for refresh operations */}
        {loading && reports.users && (
          <Box mb={3}>
            <LinearProgress />
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Refreshing reports...
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Report Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.key}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Report Content */}
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && renderUserReports()}
          {activeTab === 1 && renderBlotterReports()}
          {activeTab === 2 && renderCertificateReports()}
          {activeTab === 3 && renderResidentReports()}
          {activeTab === 4 && renderSystemReports()}
          {activeTab === 5 && renderSecurityReports()}
        </Box>

        {/* Report Footer */}
        <Box sx={{ mt: 6, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="textSecondary" align="center">
            Reports generated on {reports.users ? formatDate(reports.users.generated_at) : 'Loading...'}
            {' • '}THEMIS ClearPass System v1.0
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default AdminReports
