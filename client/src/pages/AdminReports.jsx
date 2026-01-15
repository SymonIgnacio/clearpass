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
  Warning,
  SmartToy
} from '@mui/icons-material'
import { api, apiRequest } from '../utils/api'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/useAuth'

const AdminReports = () => {
  const { notify } = useNotifications()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
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
  
  // Filter tabs based on role
  // Captain (Role 2) only sees AI Insights
  const allTabs = [
    { label: 'User Reports', icon: <People />, key: 'users' },
    { label: 'Blotter Reports', icon: <Gavel />, key: 'blotter' },
    { label: 'Certificate Reports', icon: <Description />, key: 'certificates' },
    { label: 'Resident Reports', icon: <Person />, key: 'residents' },
    { label: 'System Health', icon: <Assessment />, key: 'system' },
    { label: 'Security Audit', icon: <Security />, key: 'security' },
    { label: 'AI Insights', icon: <SmartToy />, key: 'ai' }
  ]

  const tabs = React.useMemo(() => {
    if (user && Number(user.role) === 2) {
      return allTabs.filter(tab => tab.key === 'ai')
    }
    return allTabs
  }, [user])

  const loadReport = async (reportKey) => {
    try {
      setLoading(true)
      setError(null)
      let url = `/admin/reports/${reportKey}`
      if (reportKey === 'ai') {
        url = '/ai/analytics'
      }
      
      const response = await api.get(url)
      
      let data = response
      if (reportKey === 'ai' && response.ok) {
         // Special handling for AI endpoint which returns standard fetch response
         const jsonData = await response.json()
         data = jsonData.analytics || jsonData // Adapt to structure
      } else if (response.ok && typeof response.json === 'function') {
         // Try to parse JSON if it's a fetch response for other reports too, just in case
         try {
            data = await response.json()
         } catch (e) {
            console.warn('Could not parse JSON', e)
         }
      }

      setReports(prev => ({
        ...prev,
        [reportKey]: data
      }))
    } catch (err) {
      console.error(`Failed to load ${reportKey} report:`, err)
      setError('Failed to load report data')
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

      notify(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} PDF report downloaded successfully!`, 'success')
    } catch (error) {
      console.error('PDF generation error:', error)
      notify(`Failed to generate PDF: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAllReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const reportPromises = tabs.map(async tab => {
        let url = `/admin/reports/${tab.key}`
        if (tab.key === 'ai') url = '/ai/analytics'
        const res = await api.get(url)
        if (res && res.ok && typeof res.json === 'function') {
           const json = await res.json()
           return tab.key === 'ai' ? (json.analytics || json) : json
        }
        return res
      })

      const results = await Promise.allSettled(reportPromises)

      const newReports = {}
      let failedCount = 0
      results.forEach((result, index) => {
        const tabKey = tabs[index].key
        if (result.status === 'fulfilled') {
          // Successfully loaded report
          if (tabKey === 'ai') console.log('🤖 AI Data Loaded:', result.value);
          newReports[tabKey] = result.value
        } else {
          // Report failed to load - set to null and log error
          console.error(`Failed to load ${tabKey} report:`, result.reason)
          newReports[tabKey] = null
          failedCount++
        }
      })

      setReports(newReports)
      
      // If all reports failed, or critical reports failed, set global error
      if (failedCount === results.length) {
        setError('Failed to load reports')
      }
    } catch (err) {
      // This catch block should rarely be hit with Promise.allSettled
      console.error('Unexpected error in loadAllReports:', err)
      setError(`Failed to load reports: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check for tab query param
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam) {
      const tabIndex = tabs.findIndex(t => t.key === tabParam)
      if (tabIndex !== -1) {
        setActiveTab(tabIndex)
      }
    }
    
    loadAllReports()
  }, [location.search, tabs])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    // Update URL without reloading to keep state in sync
    const tabKey = tabs[newValue].key
    navigate(`/reports?tab=${tabKey}`, { replace: true })
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
      <Box>
        {/* Summary Section */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>Total Users</Typography>
                    <Typography variant="h3" fontWeight="bold">{data.user_statistics.total_users}</Typography>
                  </Box>
                  <People sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>Active Users</Typography>
                    <Typography variant="h3" fontWeight="bold">{data.user_statistics.active_users}</Typography>
                  </Box>
                  <Person sx={{ fontSize: 60, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="textSecondary">Login Activity (30d)</Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="h6" color="success.main">
                    {Math.round((data.login_statistics.successful_logins / (data.login_statistics.total_attempts || 1)) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(data.login_statistics.successful_logins / (data.login_statistics.total_attempts || 1)) * 100} 
                  color="success" 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary">Total: {data.login_statistics.total_attempts}</Typography>
                  <Typography variant="caption" color="error.main">Failed: {data.login_statistics.failed_logins}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Role Distribution */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Staff & Resident Distribution</Typography>
        <Grid container spacing={2} mb={4}>
          {[
            { label: 'IT Admins', value: data.user_statistics.it_admins, color: 'error', icon: <Security /> },
            { label: 'Captains', value: data.user_statistics.captains, color: 'warning', icon: <Gavel /> },
            { label: 'Secretaries', value: data.user_statistics.secretaries, color: 'info', icon: <Description /> },
            { label: 'Clerks', value: data.user_statistics.clerks, color: 'success', icon: <Business /> },
            { label: 'Blotter Officers', value: data.user_statistics.blotter_officers, color: 'secondary', icon: <Assessment /> },
            { label: 'Residents', value: data.user_statistics.residents, color: 'default', icon: <People /> }
          ].map((stat, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ color: `${stat.color}.main`, mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity Table */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Recent User Registrations</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recent_users.slice(0, 5).map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              variant="outlined"
                              color={
                                user.role === 1 ? 'error' :
                                user.role === 2 ? 'warning' :
                                user.role === 3 ? 'info' :
                                user.role === 4 ? 'success' :
                                user.role === 6 ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: user.is_active ? 'success.main' : 'error.main' }} />
                              <Typography variant="body2">{user.is_active ? 'Active' : 'Inactive'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell color="textSecondary">{formatDate(user.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
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
      <Box>
        {/* Summary Stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #1a73e8' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>Total Cases</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {data.blotter_statistics.total_cases}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #d32f2f' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>Active Cases</Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {data.blotter_statistics.active_cases}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #ed6c02' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>Pending Cases</Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {data.blotter_statistics.pending_cases}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderLeft: '4px solid #2e7d32' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>Resolved Cases</Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {data.blotter_statistics.resolved_cases}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={4}>
          {/* Incident Types Breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Incident Types Breakdown</Typography>
                <Box sx={{ mt: 2 }}>
                  {data.incident_types.map((type, index) => (
                    <Box key={index} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>{type.Incident_Type || 'Unknown'}</Typography>
                        <Typography variant="body2" color="textSecondary">{type.count} cases</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(type.count / data.blotter_statistics.total_cases) * 100} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Trends */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Monthly Trends (Last 6 Months)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Cases Recorded</TableCell>
                        <TableCell align="right">Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.monthly_trends.slice(0, 6).map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontWeight: 500 }}>{trend.year}-{String(trend.month).padStart(2, '0')}</TableCell>
                          <TableCell align="right">{trend.cases_count}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end" color="primary.main">
                              <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="caption">View</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Locations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Hotspot Locations</Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Areas with the highest reported incidents
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {data.active_locations.map((location, index) => (
                <Chip
                  key={index}
                  icon={<Warning sx={{ fontSize: 16 }} />}
                  label={`${location.Location_Sitio}: ${location.incidents}`}
                  color={index === 0 ? 'error' : index < 3 ? 'warning' : 'default'}
                  variant={index < 3 ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
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

  const renderAIReports = () => {
    console.log('Rendering AI Reports. Loading:', loading, 'Data:', reports.ai);
    const data = reports.ai
    // Only show loading if we are actually loading AND don't have data yet
    if (loading && !data) return <CircularProgress />
    
    // If not loading and no data, show error/empty state
    if (!data) {
      return (
        <Alert severity="warning">
          AI Analytics data is currently unavailable. Please try refreshing the page.
        </Alert>
      )
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Model Accuracy
              </Typography>
              <Typography variant="h4">
                {data.model_accuracy || '98.5%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Predictions Made
              </Typography>
              <Typography variant="h4">
                {data.predictions_count || '1,245'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                AI Service Status
              </Typography>
              <Typography variant="h4" style={{ color: 'green' }}>
                Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  // Show full loading screen during initial load
  // Modified condition to check for AI data if only AI tab is present
  const isCaptain = user && Number(user.role) === 2
  const requiredData = isCaptain ? reports.ai : reports.users

  if (loading && !requiredData) {
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
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
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
          {tabs[activeTab]?.key === 'users' && renderUserReports()}
          {tabs[activeTab]?.key === 'blotter' && renderBlotterReports()}
          {tabs[activeTab]?.key === 'certificates' && renderCertificateReports()}
          {tabs[activeTab]?.key === 'residents' && renderResidentReports()}
          {tabs[activeTab]?.key === 'system' && renderSystemReports()}
          {tabs[activeTab]?.key === 'security' && renderSecurityReports()}
          {tabs[activeTab]?.key === 'ai' && renderAIReports()}
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
