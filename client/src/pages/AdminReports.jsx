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
  LinearProgress
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
import { api } from '../utils/api'

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

  const loadAllReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const reportPromises = tabs.map(tab =>
        api.get(`/admin/reports/${tab.key}`).catch(err => {
          console.error(`Failed to load ${tab.key} report:`, err)
          return null
        })
      )

      const results = await Promise.all(reportPromises)

      const newReports = {}
      tabs.forEach((tab, index) => {
        newReports[tab.key] = results[index]
      })

      setReports(newReports)
    } catch (err) {
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
              <TableContainer>
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
              <TableContainer>
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
              <TableContainer>
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
              <TableContainer>
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
              <TableContainer>
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
              <TableContainer>
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
              onClick={() => {/* TODO: Implement export functionality */}}
              disabled
            >
              Export Reports
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

        {/* Loading Progress */}
        {loading && (
          <Box mb={3}>
            <LinearProgress />
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Loading reports...
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
