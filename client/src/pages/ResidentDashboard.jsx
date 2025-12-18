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
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormControl,
  FormLabel,
  Divider,
  Paper
} from '@mui/material'
import {
  Person,
  Description,
  CheckCircle,
  Warning,
  AccountCircle,
  Refresh,
  Assignment,
  Phone,
  Email,
  PhotoCamera
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const ResidentDashboard = ({ user }) => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [clearanceModal, setClearanceModal] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)

  // Form states
  const [clearanceForm, setClearanceForm] = useState({
    clearanceType: '',
    purpose: ''
  })
  const [qrCode, setQrCode] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    fetchMyRequests()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('resident/dashboard')
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data.')
    }
  }

  const fetchMyRequests = async () => {
    try {
      const response = await apiRequest('resident/requests')
      const data = await response.json()
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestClearance = async () => {
    if (!clearanceForm.clearanceType || !clearanceForm.purpose) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      const response = await apiRequest('resident/request-clearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clearanceForm)
      })

      const data = await response.json()

      if (response.ok) {
        setQrCode(data.qr_code)
        setClearanceModal(false)
        setQrModal(true)
        fetchMyRequests() // Refresh requests
      } else {
        setError(data.error || 'Failed to submit request.')
      }
    } catch (error) {
      console.error('Error requesting clearance:', error)
      setError('Failed to submit clearance request.')
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setError('Please select a photo file.')
      return
    }

    const formData = new FormData()
    formData.append('photo', photoFile)

    try {
      const response = await apiRequest('resident/profile/update-photo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setProfileModal(false)
        setPhotoFile(null)
        fetchDashboardData() // Refresh profile data
        alert('Profile photo updated successfully!')
      } else {
        setError(data.error || 'Failed to update photo.')
      }
    } catch (error) {
      console.error('Error updating photo:', error)
      setError('Failed to update profile photo.')
    }
  }

  const getStatusCard = () => {
    if (!dashboardData) return null

    const { status, blocking_case } = dashboardData

    if (status === 'CLEARED') {
      return (
        <Card sx={{
          background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
          border: '2px solid #4caf50',
          mb: 3
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#2e7d32' }}>
              You are Cleared
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your barangay record is clean. You can proceed with clearance requests.
            </Typography>
          </CardContent>
        </Card>
      )
    } else {
      return (
        <Card sx={{
          background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
          border: '2px solid #f44336',
          mb: 3
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Warning sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#c62828' }}>
              Accountability Detected
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {blocking_case || 'You have active cases that prevent clearance requests.'}
            </Typography>
            <Typography variant="body2" color="error">
              Please visit the Barangay Hall to resolve this matter.
            </Typography>
          </CardContent>
        </Card>
      )
    }
  }

  const quickActions = [
    {
      icon: <Description />,
      title: 'Request Clearance',
      description: 'Apply for barangay certificates and clearances',
      color: '#1a73e8',
      action: 'request_clearance',
      disabled: dashboardData?.status === 'BLOCKED'
    },
    {
      icon: <Person />,
      title: 'My Profile',
      description: 'View and update your personal information',
      color: '#34a853',
      action: 'my_profile'
    },
    {
      icon: <Assignment />,
      title: 'Track Requests',
      description: 'Check status of your document requests',
      color: '#fbbc04',
      action: 'track_requests'
    }
  ]

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
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
          Resident Portal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your barangay services and track your requests
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status Card */}
      {getStatusCard()}

      {/* Quick Actions Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                '&:hover': action.disabled ? {} : {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
              onClick={() => {
                if (action.disabled) return

                switch (action.action) {
                  case 'request_clearance':
                    setClearanceModal(true)
                    break
                  case 'my_profile':
                    setProfileModal(true)
                    break
                  case 'track_requests':
                    // Scroll to requests section
                    document.getElementById('requests-section')?.scrollIntoView({ behavior: 'smooth' })
                    break
                  default:
                    break
                }
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{
                  bgcolor: action.color,
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {action.icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Profile Summary */}
      {dashboardData?.profile && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={dashboardData.profile.photo_url}
                sx={{ width: 60, height: 60, mr: 3 }}
              >
                {dashboardData.profile.name?.charAt(0) || 'R'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {dashboardData.profile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resident ID: {dashboardData.profile.resident_id}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">
                    {dashboardData.profile.contact_number || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">
                    {dashboardData.profile.email || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card id="requests-section">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Recent Requests
          </Typography>

          {requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your document requests will appear here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requests.slice(0, 5).map((request, index) => (
                <Paper key={index} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {request.certificate_type} Clearance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Request ID: {request.control_no}
                      </Typography>
                    </Box>
                    <Chip
                      label={request.status}
                      color={
                        request.status === 'Approved' ? 'success' :
                        request.status === 'Pending' ? 'warning' :
                        request.status === 'Released' ? 'info' : 'default'
                      }
                      size="small"
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Clearance Request Modal */}
      <Dialog open={clearanceModal} onClose={() => setClearanceModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Clearance</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Clearance Type</FormLabel>
            <RadioGroup
              value={clearanceForm.clearanceType}
              onChange={(e) => setClearanceForm({ ...clearanceForm, clearanceType: e.target.value })}
            >
              <FormControlLabel value="Barangay" control={<Radio />} label="Barangay Clearance" />
              <FormControlLabel value="Indigency" control={<Radio />} label="Certificate of Indigency" />
              <FormControlLabel value="Residency" control={<Radio />} label="Certificate of Residency" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Purpose"
            multiline
            rows={3}
            value={clearanceForm.purpose}
            onChange={(e) => setClearanceForm({ ...clearanceForm, purpose: e.target.value })}
            sx={{ mt: 3 }}
            placeholder="Please specify the purpose of this clearance request..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearanceModal(false)}>Cancel</Button>
          <Button
            onClick={handleRequestClearance}
            variant="contained"
            disabled={!clearanceForm.clearanceType || !clearanceForm.purpose}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrModal} onClose={() => setQrModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>Request Submitted Successfully!</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Show this QR code to the barangay clerk to process your request.
          </Typography>

          {qrCode && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img
                src={qrCode}
                alt="QR Code"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            Your request has been recorded and is now pending approval.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModal(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Update Modal */}
      <Dialog open={profileModal} onClose={() => setProfileModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can update your profile photo once every 6 months.
          </Typography>

          <Box sx={{ textAlign: 'center' }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={(e) => setPhotoFile(e.target.files[0])}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                sx={{ mb: 2 }}
              >
                Choose Photo
              </Button>
            </label>

            {photoFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Selected: {photoFile.name}
                </Typography>
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileModal(false)}>Cancel</Button>
          <Button
            onClick={handlePhotoUpload}
            variant="contained"
            disabled={!photoFile}
          >
            Upload Photo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ResidentDashboard
