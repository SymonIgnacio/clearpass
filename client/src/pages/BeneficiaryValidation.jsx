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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip
} from '@mui/material'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import Visibility from '@mui/icons-material/Visibility'
import People from '@mui/icons-material/People'
import { apiRequest } from '../utils/api'
import { useNotifications } from '../contexts/NotificationContext'
import RejectionModal from '../components/RejectionModal'
import ConfirmationModal from '../components/ConfirmationModal'

const BeneficiaryValidation = () => {
  const { notify } = useNotifications()
  const [beneficiaries, setBeneficiaries] = useState([])
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(null)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [confirmationAction, setConfirmationAction] = useState(null)
  
  // Document Viewing State
  const [viewDocsOpen, setViewDocsOpen] = useState(false)
  const [residentDocs, setResidentDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    fetchBeneficiaries()
  }, [])

  const fetchBeneficiaries = async () => {
    try {
      const response = await apiRequest('secretary/beneficiaries')
      if (response.ok) {
        const data = await response.json()
        setBeneficiaries(data)
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error)
    }
  }

  const handleAction = async (id, action, reason = '') => {
    try {
      const response = await apiRequest(`secretary/beneficiaries/${id}/validate`, {
        method: 'POST',
        body: { action, reason }
      })

      if (response.ok) {
        fetchBeneficiaries()
        notify(`Beneficiary ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success')
      } else {
        notify(`Error ${action}ing beneficiary`, 'error')
      }
    } catch (error) {
      console.error(`Error ${action}ing beneficiary:`, error)
      notify(`Error ${action}ing beneficiary`, 'error')
    }
  }

  const openRejectionModal = (id) => {
    setSelectedBeneficiaryId(id)
    setRejectionModalOpen(true)
  }

  const handleRejectionConfirm = async (reason) => {
    setRejectionModalOpen(false)
    await handleAction(selectedBeneficiaryId, 'reject', reason)
    setSelectedBeneficiaryId(null)
  }

  const openApprovalModal = (id) => {
    setConfirmationAction({
      type: 'approve',
      id: id,
      title: 'Approve Beneficiary',
      message: 'Are you sure you want to approve this beneficiary? This will confirm their status in the system.',
      icon: 'success'
    })
    setConfirmationModalOpen(true)
  }

  const handleConfirmationConfirm = async () => {
    setConfirmationModalOpen(false)
    if (confirmationAction?.type === 'approve') {
      await handleAction(confirmationAction.id, 'approve')
    }
    setConfirmationAction(null)
  }

  const fetchDocuments = async (residentId) => {
    setLoadingDocs(true)
    setResidentDocs([])
    try {
      const response = await apiRequest(`residents/${residentId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setResidentDocs(data)
      } else {
        notify('Failed to load documents', 'error')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      notify('Error loading documents', 'error')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleViewDocs = (residentId) => {
    setViewDocsOpen(true)
    fetchDocuments(residentId)
  }

  const openFile = async (docId, fileName) => {
    try {
      // Use the generic download endpoint which handles permissions
      const response = await apiRequest(`residents/0/documents/${docId}/download`) 
      // Note: passing 0 as residentId in path is a hack if the backend ignores it for admins/secretary
      // Let's check residentRoutes.js: router.get('/:id/documents/:docId/download'...)
      // The backend checks if req.user.role === RESIDENT && residentId !== effectiveId.
      // Since we are Secretary, we can pass '0' or the actual ID. Ideally actual ID.
      // But we don't have the resident ID handy in the document object loop easily unless we store it.
      // Actually residentDocs items have `resident_id`.
    } catch (e) {
       // logic is handled in helper below
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'verified': case 'approved': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        <People sx={{ mr: 1, verticalAlign: 'middle' }} />
        Beneficiary Validation
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
        Validate 4Ps, PWD, Solo Parent, and other beneficiary statuses.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Resident Name</TableCell>
              <TableCell>Claimed Status</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell>Vulnerability Score</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {beneficiaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No pending validations found.
                </TableCell>
              </TableRow>
            ) : (
              beneficiaries.map((b) => (
                <TableRow key={b.Resident_ID}>
                  <TableCell>
                    {b.First_Name} {b.Last_Name}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {b.Resident_ID}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {b.Is_4Ps === 1 && <Chip label="4Ps" size="small" color="info" />}
                      {b.Is_PWD === 1 && <Chip label="PWD" size="small" color="secondary" />}
                      {b.Is_Solo_Parent === 1 && <Chip label="Solo Parent" size="small" color="warning" />}
                      {b.Is_Out_of_School_Youth === 1 && <Chip label="OSY" size="small" color="error" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={b.validation_status || 'Pending'} 
                      color={b.validation_status === 'approved' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{b.Vulnerability_Score}</TableCell>
                  <TableCell>
                    <Tooltip title="View Proof">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewDocs(b.Resident_ID)}
                        sx={{ mr: 1 }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {(!b.validation_status || b.validation_status === 'pending') && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton 
                            color="success" 
                            onClick={() => openApprovalModal(b.Resident_ID)}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton 
                            color="error" 
                            onClick={() => openRejectionModal(b.Resident_ID)}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Document Viewing Modal */}
      <Dialog
        open={viewDocsOpen}
        onClose={() => setViewDocsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Beneficiary Documents</DialogTitle>
        <DialogContent dividers>
          {loadingDocs ? (
            <Typography>Loading documents...</Typography>
          ) : residentDocs.length === 0 ? (
            <Alert severity="warning">No documents uploaded by this resident.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date Uploaded</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {residentDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Chip label={doc.document_type.replace('_', ' ').toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell>{doc.file_name}</TableCell>
                    <TableCell>
                       <Chip 
                          label={doc.verification_status} 
                          color={getStatusColor(doc.verification_status)} 
                          size="small" 
                        />
                    </TableCell>
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => openFileFromEndpoint(`residents/${doc.resident_id}/documents/${doc.id}/download`, doc.file_name)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDocsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <RejectionModal
        open={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleRejectionConfirm}
        title="Reject Beneficiary"
        message="Please provide a reason for rejecting this beneficiary status:"
        inputLabel="Rejection Reason"
      />

      <ConfirmationModal
        open={confirmationModalOpen}
        onClose={() => {
            setConfirmationModalOpen(false)
            setConfirmationAction(null)
        }}
        onConfirm={handleConfirmationConfirm}
        title={confirmationAction?.title}
        message={confirmationAction?.message}
        type={confirmationAction?.icon}
        confirmText="Approve"
      />
    </Box>
  )
}

export default BeneficiaryValidation
