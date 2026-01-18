import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import Description from '@mui/icons-material/Description'
import Assignment from '@mui/icons-material/Assignment'
import { apiRequest } from '../utils/api'
import { useNotifications } from '../contexts/NotificationContext'
import RejectionModal from '../components/RejectionModal'
import ConfirmationModal from '../components/ConfirmationModal'
import CredentialsModal from '../components/CredentialsModal'

const DocumentVerification = () => {
  const { notify } = useNotifications()
  const [filterStatus, setFilterStatus] = useState('pending')
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [selectedApplicationDocuments, setSelectedApplicationDocuments] = useState([])
  
  // Modal States
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectionAction, setRejectionAction] = useState(null)
  
  // New Credentials Modal
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [newCredentials, setNewCredentials] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [filterStatus])

  const fetchApplications = async () => {
    try {
      const response = await apiRequest(`secretary/applications?status=${filterStatus}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchApplicationDocuments = async (applicationId) => {
    try {
      const response = await apiRequest(`secretary/applications/${applicationId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setSelectedApplicationDocuments(data)
      } else {
        setSelectedApplicationDocuments([])
      }
    } catch (error) {
      console.error('Error fetching application documents:', error)
      setSelectedApplicationDocuments([])
    }
  }

  const openFileFromEndpoint = async (endpoint, fileName) => {
    try {
      const response = await apiRequest(endpoint)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        notify(data.error || 'Failed to open file', 'error')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) {
        const a = document.createElement('a')
        a.href = url
        a.download = fileName || 'document'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (error) {
      console.error('Error opening file:', error)
      notify('Error opening file', 'error')
    }
  }

  const handleApplicationAction = async (applicationId, action, reason = '') => {
    try {
      const response = await apiRequest(`secretary/applications/${applicationId}/${action}`, {
        method: 'POST',
        body: { reason }
      })

      if (response.ok) {
        const data = await response.json().catch(() => null)
        
        // Optimistic Update
        if (filterStatus === 'pending') {
          setApplications(prev => prev.filter(app => app.application_id !== applicationId))
        } else {
          setApplications(prev => prev.map(app => 
            app.application_id === applicationId ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' } : app
          ))
        }

        // Close modals if open
        if (selectedApplication?.application_id === applicationId) {
          setSelectedApplication(null)
        }

        fetchApplications()
        
        if (action === 'approve' && data?.credentials?.email && data?.credentials?.temp_password) {
          // Show credentials modal instead of alert
          setNewCredentials({
            resident_code: data.credentials.resident_id || 'N/A', // Assuming API returns this or we use application ID
            user_email: data.credentials.email,
            temp_password: data.credentials.temp_password
          })
          setCredentialsModalOpen(true)
          return
        }
        notify(`Application ${action}d successfully`, 'success')
      } else {
        const data = await response.json().catch(() => ({}))
        console.error(`Error ${action}ing application:`, data)
        notify(data.error || `Error ${action}ing application`, 'error')
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error)
      notify(`Error ${action}ing application: ${error.message}`, 'error')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': case 'verified': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const openRejectionModal = (type, id) => {
    setRejectionAction({ type, id })
    setRejectionModalOpen(true)
  }

  const handleRejectionConfirm = async (reason) => {
    setRejectionModalOpen(false)
    if (rejectionAction?.type === 'application') {
      await handleApplicationAction(rejectionAction.id, 'reject', reason)
    }
    setRejectionAction(null)
  }

  const openApprovalConfirmation = () => {
    setConfirmationAction({
      id: selectedApplication.application_id,
      title: 'Approve Application',
      message: 'Are you sure you want to approve this resident application? This will create a new resident record and user account.',
      icon: 'success'
    })
    setConfirmationModalOpen(true)
  }

  const handleConfirmationConfirm = async () => {
    setConfirmationModalOpen(false)
    if (confirmationAction) {
      await handleApplicationAction(confirmationAction.id, 'approve')
      setConfirmationAction(null)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
        Registration Applications
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
        Review new resident registration applications.
      </Typography>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Applications</Typography>
          <ToggleButtonGroup
            value={filterStatus}
            exclusive
            onChange={(e, newStatus) => {
              if (newStatus !== null) setFilterStatus(newStatus)
            }}
            size="small"
          >
            <ToggleButton value="pending">Pending</ToggleButton>
            <ToggleButton value="approved">Approved</ToggleButton>
            <ToggleButton value="rejected">Rejected</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Vulnerabilities</TableCell>
                <TableCell>Status</TableCell>
                {filterStatus !== 'pending' && <TableCell>Reviewed At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.application_id}>
                  <TableCell>{app.application_id}</TableCell>
                  <TableCell>
                    {app.first_name} {app.middle_name} {app.last_name} {app.suffix}
                  </TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>{app.street_address}, {app.sitio}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {app.is_4ps && <Chip label="4Ps" size="small" color="info" />}
                      {app.is_pwd && <Chip label="PWD" size="small" color="secondary" />}
                      {app.is_solo_parent && <Chip label="Solo Parent" size="small" color="warning" />}
                      {app.is_out_of_school_youth && <Chip label="OSY" size="small" color="error" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={app.status} 
                      color={getStatusColor(app.status)} 
                      size="small" 
                    />
                  </TableCell>
                  {filterStatus !== 'pending' && (
                    <TableCell>
                      {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip title="Review Application">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedApplication(app)
                          fetchApplicationDocuments(app.application_id)
                        }}
                      >
                        <Assignment />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Application Review Dialog */}
      <Dialog 
        open={!!selectedApplication} 
        onClose={() => {
          setSelectedApplication(null)
          setSelectedApplicationDocuments([])
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Review Residency Application</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>Personal Information</Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name} {selectedApplication.suffix}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Birthdate:</strong> {selectedApplication.birthdate}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Gender:</strong> {selectedApplication.gender}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Civil Status:</strong> {selectedApplication.civil_status}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>Contact & Address</Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedApplication.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Mobile:</strong> {selectedApplication.mobile_number || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Address:</strong> {selectedApplication.street_address}, {selectedApplication.sitio}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ mt: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Uploaded Documents</Typography>
                  {selectedApplicationDocuments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No documents found for this application.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>File</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedApplicationDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{doc.document_type}</TableCell>
                            <TableCell>{doc.file_name}</TableCell>
                            <TableCell>
                              <Chip
                                label={doc.verification_status}
                                color={getStatusColor(doc.verification_status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Open File">
                                <IconButton
                                  size="small"
                                  aria-label="Open File"
                                  onClick={() =>
                                    openFileFromEndpoint(
                                      `secretary/applications/${selectedApplication.application_id}/documents/${doc.id}/download`,
                                      doc.file_name
                                    )
                                  }
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Review all uploaded documents and personal information before approving this application.
                  Approved residents will receive login credentials via email.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
      <DialogActions>
          <Button onClick={() => {
            setSelectedApplication(null)
            setSelectedApplicationDocuments([])
          }}>Cancel</Button>
          {selectedApplication?.status === 'pending' && (
            <>
              <Button 
                color="error" 
                startIcon={<Cancel />}
                onClick={() => openRejectionModal('application', selectedApplication.application_id)}
              >
                Reject
              </Button>
              <Button 
                color="success" 
                variant="contained" 
                startIcon={<CheckCircle />}
                onClick={openApprovalConfirmation}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Rejection Modal */}
      <RejectionModal
        open={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleRejectionConfirm}
        title="Reject Application"
        message="Please provide a reason for rejecting this application:"
        inputLabel="Rejection Reason"
      />

      <CredentialsModal
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        credentials={newCredentials}
      />
    </Box>
  )
}

export default DocumentVerification
