import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  Avatar
} from '@mui/material'
import {
  People,
  Search,
  CheckCircle,
  Cancel,
  Pending,
  VerifiedUser,
  Error,
  Person,
  SupervisorAccount,
  Refresh,
  Visibility
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const Users = ({ user }) => {
  const [users, setUsers] = useState([])
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Review dialogs
  const [reviewDialog, setReviewDialog] = useState({ open: false, type: '', data: null })
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchResidents()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await apiRequest('admin/residents-verification')
      if (response.ok) {
        const data = await response.json()
        setResidents(data || [])
      }
    } catch (error) {
      console.error('Error fetching residents:', error)
      setError('Failed to fetch residents for verification')
    }
  }

  const handleVerifyResident = async (residentId, verificationType) => {
    setLoading(true)
    try {
      const response = await apiRequest(`admin/verify-resident/${residentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_type: verificationType })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(result.message)
        fetchResidents()
        setReviewDialog({ open: false, type: '', data: null })
        setReviewNotes('')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Verification failed')
      }
    } catch (error) {
      console.error('Error verifying resident:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      `${u.full_name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const pendingResidency = residents.filter(r => r.Residency_Status === 'Pending')
  const pendingVulnerability = residents.filter(r => 
    (r.Is_4Ps || r.Is_PWD || r.Is_Senior || r.Is_Solo_Parent || r.Is_Out_of_School_Youth) && 
    !r.verified_at
  )

  const getUserInitials = (fullName) => {
    if (!fullName) return 'U'
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 2: return 'warning'   // Captain
      case 3: return 'info'      // Secretary
      case 4: return 'success'   // Clerk
      case 5: return 'error'     // IT Admin
      case 6: return 'secondary' // Blotter Officer
      case 12: return 'primary'  // Resident
      default: return 'default'
    }
  }

  const getRoleIcon = (roleId) => {
    return roleId === 12 ? <Person /> : <SupervisorAccount />
  }

  const getVulnerabilityChips = (resident) => {
    const vulnerabilities = []
    if (resident.Is_4Ps) vulnerabilities.push('4Ps')
    if (resident.Is_PWD) vulnerabilities.push('PWD')
    if (resident.Is_Senior) vulnerabilities.push('Senior')
    if (resident.Is_Solo_Parent) vulnerabilities.push('Solo Parent')
    if (resident.Is_Out_of_School_Youth) vulnerabilities.push('OSY')
    return vulnerabilities
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          User Management
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => {
            fetchUsers()
            fetchResidents()
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Active Users (${filteredUsers.length})`} />
        <Tab label={`Residency Verification (${pendingResidency.length})`} />
        <Tab label={`Vulnerability Verification (${pendingVulnerability.length})`} />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Search Users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
              placeholder="Search by name, username, or email"
            />
          </Paper>

          {/* Users Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(u.role_id) + '.main' }}>
                          {getUserInitials(u.full_name || u.username)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {u.full_name || 'No name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{u.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(u.role_id)}
                        label={u.role_name || `Role ${u.role_id}`}
                        color={getRoleColor(u.role_id)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{u.email || 'No email'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active ? 'Active' : 'Inactive'}
                        color={u.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 1 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pending Residency Verifications
          </Typography>

          {pendingResidency.length === 0 ? (
            <Alert severity="info">No pending residency verification requests.</Alert>
          ) : (
            <Grid container spacing={2}>
              {pendingResidency.map((resident) => (
                <Grid item xs={12} md={6} lg={4} key={resident.Resident_ID}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Person sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="h6">
                          {resident.First_Name} {resident.Last_Name}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ID: {resident.Resident_ID}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        📍 Sitio: {resident.sitio_name || 'N/A'}<br />
                        🏠 Household: {resident.Household_Number || 'N/A'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleVerifyResident(resident.Resident_ID, 'residency')}
                          startIcon={<CheckCircle />}
                          disabled={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setReviewDialog({ open: true, type: 'residency', data: resident })}
                          startIcon={<Visibility />}
                        >
                          View Details
                        </Button>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Status: {resident.Residency_Status}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 2 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pending Vulnerability Verifications
          </Typography>

          {pendingVulnerability.length === 0 ? (
            <Alert severity="info">No pending vulnerability verification requests.</Alert>
          ) : (
            <Grid container spacing={2}>
              {pendingVulnerability.map((resident) => (
                <Grid item xs={12} md={6} lg={4} key={resident.Resident_ID}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VerifiedUser sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="h6">
                          {resident.First_Name} {resident.Last_Name}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ID: {resident.Resident_ID}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        📍 Sitio: {resident.sitio_name || 'N/A'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {getVulnerabilityChips(resident).map((vuln, index) => (
                          <Chip
                            key={index}
                            label={vuln}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleVerifyResident(resident.Resident_ID, 'vulnerability')}
                          startIcon={<CheckCircle />}
                          disabled={loading}
                        >
                          Verify
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setReviewDialog({ open: true, type: 'vulnerability', data: resident })}
                          startIcon={<Visibility />}
                        >
                          View Details
                        </Button>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Score: {resident.Vulnerability_Score || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false, type: '', data: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          {reviewDialog.type === 'residency' ? 'Residency Verification Details' : 'Vulnerability Verification Details'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.data && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Resident ID"
                  value={reviewDialog.data.Resident_ID || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={`${reviewDialog.data.First_Name || ''} ${reviewDialog.data.Last_Name || ''}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gender"
                  value={reviewDialog.data.Gender || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Civil Status"
                  value={reviewDialog.data.Civil_Status || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sitio"
                  value={reviewDialog.data.sitio_name || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Household Number"
                  value={reviewDialog.data.Household_Number || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {reviewDialog.type === 'vulnerability' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Vulnerability Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getVulnerabilityChips(reviewDialog.data).map((vuln, index) => (
                      <Chip
                        key={index}
                        label={vuln}
                        color="info"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, type: '', data: null })}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleVerifyResident(reviewDialog.data?.Resident_ID, reviewDialog.type)}
            disabled={loading}
            startIcon={<CheckCircle />}
          >
            {loading ? 'Processing...' : `Verify ${reviewDialog.type === 'residency' ? 'Residency' : 'Vulnerability'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users