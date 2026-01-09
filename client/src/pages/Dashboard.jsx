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
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem
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
  Group,
  Person,
  Download
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import dashboardAPI from '../utils/dashboardAPI'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [blotterCases, setBlotterCases] = useState([])
  const [patrolSuggestions, setPatrolSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patrolLoading, setPatrolLoading] = useState(false)

  // IT Admin Reports State - ALWAYS DECLARED
  const [reports, setReports] = useState({
    users: null,
    blotter: null,
    certificates: null,
    residents: null,
    system: null,
    security: null
  })
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState(null)

  // Detailed reports hooks - ALWAYS DECLARED
  const [detailedReport, setDetailedReport] = useState(null)
  const [reportType, setReportType] = useState('users')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    role: '',
    search: ''
  })

  // Check if user is IT Admin (THEMIS role 1)
  const isITAdmin = user?.role === 1 || user?.role === '1'
  const userRole = user?.role || (user?.username === 'superadmin' ? 1 : null)
  const userRoleNumber = Number(userRole)

  const tabs = [
    { label: 'Overview', icon: <Analytics /> },
    ...(isITAdmin ? [{ label: 'Reports', icon: <Assignment /> }] : [])
  ]

  useEffect(() => {
    if (user && (userRole || user?.username === 'superadmin')) {
      console.log('🎯 Dashboard: Starting data fetch for user role:', userRole, 'User:', user)
      fetchRoleSpecificData()
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      console.log('🎯 Dashboard: User not authenticated, redirecting...')
      setLoading(false)
    } else {
      console.log('🎯 Dashboard: Waiting for user authentication...', { user: !!user, userRole, userObject: user })
      // Set a timeout to prevent infinite loading if auth fails
      const timeout = setTimeout(() => {
        console.warn('🎯 Dashboard: Auth timeout, loading empty data')
        setStats({ overall: { total_residents: 0, total_seniors: 0, total_pwd: 0, total_single_parents: 0 } })
        setCertificates([])
        setBlotterCases([])
        setLoading(false)
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [user, userRole])

  const fetchRoleSpecificData = async () => {
    try {
      setLoading(true)
      console.log('📊 Dashboard: Fetching dashboard data for user role:', userRole, 'User type:', user?.username)
      
      const response = await apiRequest('dashboard')
      
      if (response.ok) {
        const dashboardData = await response.json()
        console.log('📊 Dashboard: Raw API Response:', dashboardData)
        console.log('📊 Dashboard: Response structure check:', {
          hasOverall: !!dashboardData.overall,
          overallKeys: dashboardData.overall ? Object.keys(dashboardData.overall) : 'none',
          residents: dashboardData.residents,
          active_blotter: dashboardData.active_blotter,
          certificates: dashboardData.certificates,
          allKeys: Object.keys(dashboardData)
        })
        setStats(dashboardData)
      } else {
        console.error('📊 Dashboard: API response not ok:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('📊 Dashboard: Error response:', errorText)
        throw new Error(`Dashboard API failed: ${response.status}`)
      }
      
      // Fetch certificates
      await fetchCertificates()
      
      // Fetch blotter cases
      await fetchBlotterCases()
      
    } catch (error) {
      console.error('❌ Dashboard: Error fetching data:', error)
      setStats({ overall: { total_residents: 0, total_seniors: 0, total_pwd: 0, total_single_parents: 0 } })
      setCertificates([])
      setBlotterCases([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Register Resident':
        navigate('/residents')
        break
      case 'Report Incident':
        navigate('/blotter')
        break
      case 'Issue Certificate':
        navigate('/documents')
        break
      case 'AI Analysis':
        navigate('/ai-dashboard')
        break
      case 'Community Events':
        navigate('/events')
        break
      default:
        break
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiRequest('census')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({ overall: { total_residents: 0, total_seniors: 0, total_pwd: 0, total_single_parents: 0 } })
    } finally {
      setLoading(false)
    }
  }

  const fetchCertificates = async () => {
    try {
      const response = await apiRequest('certificates')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dashboard: Certificates data:', data)
        setCertificates(data || [])
      } else {
        console.warn('Certificates API failed:', response.status)
        setCertificates([])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      setCertificates([])
    }
  }

  const fetchBlotterCases = async () => {
    try {
      const response = await apiRequest('blotter')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dashboard: Blotter data:', data)
        setBlotterCases(Array.isArray(data) ? data : [])
      } else {
        console.warn('Blotter API failed:', response.status)
        setBlotterCases([])
      }
    } catch (error) {
      console.error('Error fetching blotter cases:', error)
      setBlotterCases([])
    }
  }

  const fetchPatrolSuggestions = async () => {
    setPatrolLoading(true)
    try {
      const response = await apiRequest('ai/patrol-suggestions')
      const data = await response.json()
      setPatrolSuggestions(data)
    } catch (error) {
      console.error('Error fetching patrol suggestions:', error)
      setPatrolSuggestions(null)
    } finally {
      setPatrolLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Population',
      value: stats?.overall?.total_residents || stats?.residents || 0,
      subtitle: 'Registered Residents',
      icon: <People sx={{ fontSize: 32 }} />,
      color: '#1a73e8',
      bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      status: 'Active',
      statusLabel: 'Current Status'
    },
    {
      title: 'Active Cases',
      value: stats?.active_blotter || (Array.isArray(blotterCases) ? blotterCases.filter(case_ => (case_.status || case_.Status) === 'Pending').length : 0),
      subtitle: 'Ongoing Investigations',
      icon: <Gavel sx={{ fontSize: 32 }} />,
      color: '#ea4335',
      bgColor: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      status: 'Pending',
      statusLabel: 'Status'
    },
    {
      title: 'Certificates Issued',
      value: stats?.certificates || certificates.length,
      subtitle: 'Total Certificates',
      icon: <Description sx={{ fontSize: 32 }} />,
      color: '#34a853',
      bgColor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      status: 'Available',
      statusLabel: 'Service Status'
    },
    {
      title: 'Vulnerable Groups',
      value: Number(stats?.overall?.total_seniors || 0) + Number(stats?.overall?.total_pwd || 0) + Number(stats?.overall?.total_single_parents || 0),
      subtitle: 'Seniors, PWD, Single Parents',
      icon: <Security sx={{ fontSize: 32 }} />,
      color: '#fbbc04',
      bgColor: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
      status: 'Monitored',
      statusLabel: 'Support Status'
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

  // IT Admin Reports Functions
  const loadAllReports = async () => {
    setReportsLoading(true)
    setReportsError(null)
    try {
      const reportPromises = ['users', 'blotter', 'certificates', 'residents', 'system', 'security'].map(async (reportKey) => {
        try {
          const response = await apiRequest(`admin/reports/${reportKey}`)
          const data = await response.json() // ✅ Parse JSON from Response
          return { key: reportKey, data: data }
        } catch (error) {
          console.error(`Failed to load ${reportKey} report:`, error)
          return { key: reportKey, data: null }
        }
      })

      const results = await Promise.all(reportPromises)

      const newReports = {}
      results.forEach(({ key, data }) => {
        newReports[key] = data
      })

      setReports(newReports)
    } catch (err) {
      setReportsError(`Failed to load reports: ${err.message}`)
    } finally {
      setReportsLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    // Load reports when switching to reports tab
    if (newValue === 1 && isITAdmin && !reports.users) {
      loadAllReports()
    }
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

  // Helper functions for transforming API responses to match expected format
  const getColumnsForReportType = (reportType) => {
    switch (reportType) {
      case 'blotter':
        return ['Case #', 'Incident Type', 'Complainant', 'Respondent', 'Sitio', 'Status', 'Date']
      case 'certificates':
        return ['Control No', 'Type', 'Resident', 'Purpose', 'Status', 'Date Issued', 'Issued By']
      case 'users':
        return ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Created']
      case 'residents':
        return ['ID', 'Name', 'Gender', 'Age', 'Contact', 'Status', 'Household', 'Sitio']
      default:
        return []
    }
  }

  const transformItemForReportType = (reportType, item) => {
    switch (reportType) {
      case 'blotter':
        const complainant = JSON.parse(item.Complainant_Details || '{}')
        const respondent = JSON.parse(item.Respondent_Details || '{}')
        return [
          item.Case_Number || 'N/A',
          item.Incident_Type || 'N/A',
          complainant.name || 'N/A',
          respondent.name || 'N/A',
          item.Location_Sitio || 'N/A',
          item.Status || 'N/A',
          item.DateTime_Incident ? new Date(item.DateTime_Incident).toLocaleDateString() : 'N/A'
        ]
      case 'certificates':
        return [
          item.control_no || 'N/A',
          item.certificate_type || 'N/A',
          item.resident_name || 'N/A',
          item.purpose || 'N/A',
          item.status || 'N/A',
          item.date_issued ? new Date(item.date_issued).toLocaleDateString() : 'N/A',
          item.issued_by || 'N/A'
        ]
      case 'users':
        return [
          item.id || 'N/A',
          item.username || 'N/A',
          item.full_name || 'N/A',
          item.email || 'N/A',
          item.role === 1 ? 'IT Admin' :
          item.role === 2 ? 'Clerk' :
          item.role === 3 ? 'Blotter Officer' :
          item.role === 4 ? 'Resident' :
          item.role === 5 ? 'Captain' :
          item.role === 6 ? 'Secretary' : `Role ${item.role}`,
          item.is_active ? 'Active' : 'Inactive',
          item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
        ]
      case 'residents':
        const birthDate = item.Birthdate ? new Date(item.Birthdate) : null
        const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'N/A'
        return [
          item.Resident_ID || 'N/A',
          `${item.First_Name || ''} ${item.Last_Name || ''}`.trim() || 'N/A',
          item.Gender || 'N/A',
          age,
          item.Mobile_Number || 'N/A',
          item.Residency_Status || 'N/A',
          item.Household_ID || 'N/A',
          'N/A' // Sitio not available in simplified query
        ]
      default:
        return []
    }
  }

  const transformArrayResponse = (reportType, dataArray) => {
    return {
      columns: getColumnsForReportType(reportType),
      data: dataArray.map(item => transformItemForReportType(reportType, item)),
      pagination: {
        page: 1,
        limit: 50,
        total: dataArray.length,
        pages: Math.ceil(dataArray.length / 50)
      }
    }
  }

  const reportTypes = [
    { value: 'users', label: 'User Management', icon: <People /> },
    { value: 'blotter', label: 'Blotter Cases', icon: <Gavel /> },
    { value: 'certificates', label: 'Certificates', icon: <Description /> },
    { value: 'residents', label: 'Residents', icon: <Person /> },
    { value: 'security', label: 'Security Audit', icon: <Security /> }
  ]

  const loadDetailedReport = async (type) => {
    try {
      let endpoint = ''
      let params = ''

      // Use the same endpoints as the working modules
      switch (type) {
        case 'blotter':
          endpoint = '/blotter'
          break
        case 'certificates':
          endpoint = '/certificates'
          break
        case 'users':
          endpoint = '/users'
          break
        case 'residents':
          endpoint = '/residents'
          // Add query parameters for residents
          const residentParams = new URLSearchParams()
          if (filters.search) residentParams.append('search', filters.search)
          params = `?${residentParams}`
          break
        default:
          throw new Error(`Unknown report type: ${type}`)
      }

      const response = await apiRequest(`${endpoint}${params}`)
      const data = await response.json()

      // Transform the response to match the expected format
      let transformedData = null

      if (Array.isArray(data)) {
        // Handle array responses (blotter, certificates, users, residents)
        transformedData = transformArrayResponse(type, data)
      } else if (data.data && Array.isArray(data.data)) {
        // Handle paginated responses
        transformedData = {
          columns: getColumnsForReportType(type),
          data: data.data.map(item => transformItemForReportType(type, item)),
          pagination: data.pagination || {
            page: 1,
            limit: 50,
            total: data.data.length,
            pages: 1
          }
        }
      }

      setDetailedReport(transformedData)
    } catch (error) {
      console.error(`Failed to load detailed ${type} report:`, error)
      setDetailedReport(null)
    }
  }

  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue)
    loadDetailedReport(newValue)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const generatePDF = async () => {
    try {
      const response = await apiRequest(`admin/reports/pdf/${reportType}?${new URLSearchParams(filters)}`)
      // Handle PDF download
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    }
  }

  const renderReportsContent = () => {
    if (reportsLoading && !reports.users) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading IT Admin Reports...
            </Typography>
          </Box>
        </Box>
      )
    }

    if (reportsError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {reportsError}
        </Alert>
      )
    }

    return (
      <Box>
        {/* Report Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Users</Typography>
                <Typography variant="h4">{reports.users?.user_statistics?.total_users || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total registered users</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Active Cases</Typography>
                <Typography variant="h4">{reports.blotter?.blotter_statistics?.active_cases || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Ongoing investigations</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Certificates</Typography>
                <Typography variant="h4">{reports.certificates?.certificate_statistics?.total_certificates || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total issued</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Population</Typography>
                <Typography variant="h4">{reports.residents?.resident_statistics?.total_residents || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Registered residents</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>System Health</Typography>
                <Typography variant="h4">
                  <Chip
                    label={reports.system?.database_health?.status === 'healthy' ? 'Good' : 'Check'}
                    color={reports.system?.database_health?.status === 'healthy' ? 'success' : 'warning'}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">Database status</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Security</Typography>
                <Typography variant="h4">{reports.security?.security_overview?.total_attempts_30d || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Login attempts (30d)</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Reports Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Detailed Reports</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={generatePDF}
                  disabled={!detailedReport}
                >
                  Export PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={() => loadDetailedReport(reportType)}
                >
                  Refresh Data
                </Button>
              </Box>
            </Box>

            {/* Report Type Selector */}
            <Tabs
              value={reportType}
              onChange={handleReportTypeChange}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              {reportTypes.map((type) => (
                <Tab
                  key={type.value}
                  value={type.value}
                  label={type.label}
                  icon={type.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                id="date-from-filter"
                label="Date From"
                type="date"
                size="small"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                id="date-to-filter"
                label="Date To"
                type="date"
                size="small"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              {reportType === 'users' && (
                <>
                  <TextField
                    id="role-filter"
                    label="Role"
                    select
                    size="small"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="1">IT Admin</MenuItem>
                    <MenuItem value="2">Clerk</MenuItem>
                    <MenuItem value="3">Blotter Officer</MenuItem>
                    <MenuItem value="4">Resident</MenuItem>
                    <MenuItem value="5">Captain</MenuItem>
                    <MenuItem value="6">Secretary</MenuItem>
                  </TextField>
                  <TextField
                    id="status-filter"
                    label="Status"
                    select
                    size="small"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </>
              )}
              <TextField
                id="search-filter"
                label="Search"
                size="small"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search..."
              />
            </Box>

            {/* Detailed Report Table */}
            {detailedReport ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {detailedReport.columns?.map((col, index) => (
                        <TableCell key={index}><strong>{col}</strong></TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailedReport.data?.map((row, index) => (
                      <TableRow key={index}>
                        {detailedReport.columns?.map((col, colIndex) => {
                          const value = row[col];

                          return (
                            <TableCell key={colIndex}>
                              {col === 'role' && typeof value === 'number' ? (
                                <Chip
                                  label={
                                    value === 1 ? 'IT Admin' :
                                    value === 2 ? 'Clerk' :
                                    value === 3 ? 'Blotter Officer' :
                                    value === 4 ? 'Resident' :
                                    value === 5 ? 'Captain' :
                                    value === 6 ? 'Secretary' : `Role ${value}`
                                  }
                                  size="small"
                                  color={
                                    value === 1 ? 'error' :
                                    value === 2 ? 'info' :
                                    value === 3 ? 'warning' :
                                    value === 4 ? 'default' :
                                    value === 5 ? 'secondary' : 'success'
                                  }
                                />
                              ) : (col === 'is_active' || col === 'Status' || col === 'Residency_Status') ? (
                                <Chip
                                  label={value ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={value ? 'success' : 'error'}
                                />
                              ) : (col.toLowerCase().includes('date') || col.toLowerCase().includes('created') || col.toLowerCase().includes('at')) ? (
                                formatDate(value)
                              ) : (
                                value || '-'
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={detailedReport.columns?.length || 1} align="center">
                          No data found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Select filters and click "Refresh Data" to load detailed report
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            IT Admin Reports • Last updated: {reports.users ? formatDate(reports.users.generated_at) : 'Loading...'}
          </Typography>
        </Box>
      </Box>
    )
  }

  // Debug logging
  console.log('🎯 Dashboard render:', { 
    user, 
    isITAdmin, 
    activeTab, 
    loading, 
    stats, 
    certificates: certificates.length, 
    blotterCases: blotterCases.length,
    statCardValues: {
      totalPopulation: stats?.overall?.total_residents || stats?.residents || 0,
      activeCases: stats?.active_blotter || (Array.isArray(blotterCases) ? blotterCases.filter(case_ => (case_.status || case_.Status) === 'Pending').length : 0),
      certificates: stats?.certificates || certificates.length,
      vulnerableGroups: Number(stats?.overall?.total_seniors || 0) + Number(stats?.overall?.total_pwd || 0) + Number(stats?.overall?.total_single_parents || 0)
    }
  })

  // Check if all values are zero (likely empty database)
  const allValuesZero = (
    (stats?.overall?.total_residents || stats?.residents || 0) === 0 &&
    (stats?.active_blotter || 0) === 0 &&
    (stats?.certificates || certificates.length) === 0 &&
    (Number(stats?.overall?.total_seniors || 0) + Number(stats?.overall?.total_pwd || 0) + Number(stats?.overall?.total_single_parents || 0)) === 0
  )

  return (
    <Box>
      {/* Debug Info for IT Admin */}
      {isITAdmin && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
          <Typography variant="body2">
            DEBUG: IT Admin Mode - Tabs: {tabs.length}, Active Tab: {activeTab}, Loading: {loading ? 'true' : 'false'}
          </Typography>
        </Box>
      )}

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
          {allValuesZero && (
            <Alert severity="warning" sx={{ mr: 2 }}>
              Database appears empty. Run: <code>node scripts/seed-database.js</code> to add sample data.
            </Alert>
          )}
          <Chip
            icon={<Shield />}
            label="System Online"
            color="success"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchRoleSpecificData}
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

      {/* Tabs for IT Admin */}
      {isITAdmin && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </Paper>
      )}

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
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
                          {card.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {card.statusLabel}
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
                          patrolSuggestions.overall_risk_level === 'CRITICAL' ? 'error' :
                          patrolSuggestions.overall_risk_level === 'HIGH' ? 'error' :
                          patrolSuggestions.overall_risk_level === 'MEDIUM' ? 'warning' :
                          'success'
                        }
                        sx={{
                          mb: 3,
                          borderRadius: 2,
                          '& .MuiAlert-icon': { fontSize: '1.5rem' }
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                          {patrolSuggestions.overall_risk_level} Risk Level
                        </Typography>
                        <Typography variant="body2">
                          Total Incidents: {patrolSuggestions.risk_assessment?.total_incidents || 0} •
                          Peak Hours: {patrolSuggestions.risk_assessment?.peak_hours || 'N/A'}
                        </Typography>
                      </Alert>

                      <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                        Strategic Recommendations
                      </Typography>

                      <Grid container spacing={2}>
                        {patrolSuggestions.patrol_suggestions?.slice(0, 3).map((rec, index) => (
                          <Grid xs={12} sm={4} key={index}>
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
                        )) || (
                          <Grid xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              No patrol suggestions available
                            </Typography>
                          </Grid>
                        )}
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
                        onClick={() => handleQuickAction(action.label)}
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
        </>
      )}

      {/* Reports Tab Content */}
      {activeTab === 1 && isITAdmin && renderReportsContent()}

    </Box>
  )
}

export default Dashboard
