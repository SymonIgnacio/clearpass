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
  QrCode,
  Refresh
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const Users = ({ user }) => {
  const [users, setUsers] = useState([])
  const [residencyVerifications, setResidencyVerifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Review dialogs
  const [reviewDialog, setReviewDialog] = useState({ open: false, type: '', data: null })
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchResidencyVerifications()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('auth/firebase-users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchResidencyVerifications = async () => {
    try {
      const response = await apiRequest('auth/residency-verifications/pending')
      if (response.ok) {
        const data = await response.json()
        setResidencyVerifications(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching residency verifications:', error)
    }
  }

  const handleReviewRequest = async (type, requestId, action) => {
    setLoading(true)
    try {
      const endpoint = `auth/residency-verifications/${requestId}/review`
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: {
          action: action,
          review_notes: reviewNotes
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)

        // Refresh data
        fetchResidencyVerifications()
        fetchUsers()

        setReviewDialog({ open: false, type: '', data: null })
        setReviewNotes('')
      } else {
        const error = await response.json()
        alert('Error: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error reviewing request:', error)
      alert('Error reviewing request: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      `${u.full_name} ${u.username} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const getUserInitials = (fullName) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error'
      case 'captain': return 'warning'
      case 'secretary': return 'info'
      case 'clerk': return 'success'
      case 'resident': return 'primary'
      default: return 'default'
    }
  }

  const getRoleIcon = (role) => {
    return role === 'resident' ? <Person /> : <SupervisorAccount />
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
            fetchResidencyVerifications()
          }}
        >
          Refresh
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Active Users (${filteredUsers.length})`} />
        <Tab label={`Residency Verifications (${residencyVerifications.length})`} />
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
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(u.role) + '.main' }}>
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
                        icon={getRoleIcon(u.role)}
                        label={u.role}
                        color={getRoleColor(u.role)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{u.email || 'No email'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={u.is_active ? 'Active' : 'Inactive'}
                          color={u.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        {u.residency_status && (
                          <Chip
                            label={`Residency: ${u.residency_status}`}
                            color={u.residency_status === 'verified' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      {/* Actions */}
                      {u.id !== user.id && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Person />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
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

          {residencyVerifications.length === 0 ? (
            <Alert severity="info">No pending verification requests.</Alert>
          ) : (
            <Grid container spacing={2}>
              {residencyVerifications.map((request) => (
                <Grid item xs={12} md={6} lg={4} key={request.request_id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VerifiedUser sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="h6">
                          {request.full_name}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        @{request.username}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        📧 {request.email}<br />
                        Proof: {request.proof_type}
                      </Typography>

                      {request.notes && (
                        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                          "{request.notes}"
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => setReviewDialog({ open: true, type: 'residency', data: request })}
                          startIcon={<CheckCircle />}
                        >
                          Review
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => window.open(`/uploads/${request.proof_path}`, '_blank')}
                        >
                          View Proof
                        </Button>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Requested: {new Date(request.submitted_at).toLocaleString()}
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
      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false, type: '', data: null })}>
        <DialogTitle>
          Review Residency Verification Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {reviewDialog.data && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {reviewDialog.data.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  @{reviewDialog.data.username} • {reviewDialog.data.email}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Review Notes (Optional)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes for the review..."
                  sx={{ mb: 2 }}
                />

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Important:</strong> Approving this request will grant the user access to the system.
                    Please verify proof documents carefully.
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, type: '', data: null })}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => handleReviewRequest(reviewDialog.type, reviewDialog.data?.request_id, 'reject')}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleReviewRequest(reviewDialog.type, reviewDialog.data?.request_id, 'approve')}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users
