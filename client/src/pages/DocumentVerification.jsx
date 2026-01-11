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
  Tab
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import Description from '@mui/icons-material/Description'
import Assignment from '@mui/icons-material/Assignment'
import { apiRequest } from '../utils/api'

const DocumentVerification = () => {
  const [tabValue, setTabValue] = useState(0)
  const [applications, setApplications] = useState([])
  const [residentDocuments, setResidentDocuments] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [selectedApplicationDocuments, setSelectedApplicationDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [documentViewOpen, setDocumentViewOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
    fetchResidentDocuments()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await apiRequest('secretary/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchResidentDocuments = async () => {
    try {
      const response = await apiRequest('secretary/resident-documents')
      if (response.ok) {
        const data = await response.json()
        setResidentDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching resident documents:', error)
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
        alert('Failed to open file')
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
      alert('Error opening file')
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
        fetchApplications()
        setSelectedApplication(null)
        if (action === 'approve' && data?.credentials?.email && data?.credentials?.temp_password) {
          alert(
            `Application approved.\n\nLogin credentials:\nEmail: ${data.credentials.email}\nTemp Password: ${data.credentials.temp_password}`
          )
          return
        }
        alert(`Application ${action}d successfully`)
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error)
      alert(`Error ${action}ing application`)
    }
  }

  const handleDocumentVerification = async (documentId, status, notes = '') => {
    try {
      const response = await apiRequest(`secretary/documents/${documentId}/verify`, {
        method: 'POST',
        body: { status, notes }
      })

      if (response.ok) {
        fetchResidentDocuments()
        setDocumentViewOpen(false)
        alert('Document verification updated successfully')
      }
    } catch (error) {
      console.error('Error verifying document:', error)
      alert('Error verifying document')
    }
  }

  const viewDocument = (document) => {
    setSelectedDocument(document)
    setDocumentViewOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': case 'verified': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const renderApplicationsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Pending Registration Applications</Typography>
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
  )

  const renderDocumentsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Resident Document Verification</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Resident</TableCell>
              <TableCell>Document Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residentDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  {doc.resident_name}
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {doc.resident_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={doc.document_type.replace('_', ' ').toUpperCase()} 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>{doc.file_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={doc.verification_status} 
                    color={getStatusColor(doc.verification_status)} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Document">
                    <IconButton 
                      size="small" 
                      onClick={() => viewDocument(doc)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open File">
                    <IconButton
                      size="small"
                      aria-label="Open File"
                      onClick={() => openFileFromEndpoint(`secretary/documents/${doc.id}/download`, doc.file_name)}
                    >
                      <Description />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
        Document Verification
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
        Review registration applications and verify uploaded documents before approval.
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Registration Applications" />
        <Tab label="Resident Documents" />
      </Tabs>

      {tabValue === 0 && renderApplicationsTab()}
      {tabValue === 1 && renderDocumentsTab()}

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
        <DialogTitle>Review Registration Application</DialogTitle>
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
          <Button 
            color="error" 
            startIcon={<Cancel />}
            onClick={() => {
              const reason = prompt('Enter rejection reason:')
              if (reason) {
                handleApplicationAction(selectedApplication.application_id, 'reject', reason)
              }
            }}
          >
            Reject
          </Button>
          <Button 
            color="success" 
            variant="contained" 
            startIcon={<CheckCircle />}
            onClick={() => handleApplicationAction(selectedApplication.application_id, 'approve')}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog 
        open={documentViewOpen} 
        onClose={() => setDocumentViewOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Document Verification</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedDocument.document_type.replace('_', ' ').toUpperCase()} Document
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Resident:</strong> {selectedDocument.resident_name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>File:</strong> {selectedDocument.file_name}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Document verification helps ensure the authenticity of vulnerability claims and resident identity.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentViewOpen(false)}>Cancel</Button>
          {selectedDocument && (
            <Button onClick={() => openFileFromEndpoint(`secretary/documents/${selectedDocument.id}/download`, selectedDocument.file_name)}>
              Open File
            </Button>
          )}
          <Button 
            color="error" 
            onClick={() => {
              const notes = prompt('Enter verification notes (optional):')
              handleDocumentVerification(selectedDocument.id, 'rejected', notes || '')
            }}
          >
            Reject
          </Button>
          <Button 
            color="success" 
            variant="contained"
            onClick={() => {
              const notes = prompt('Enter verification notes (optional):')
              handleDocumentVerification(selectedDocument.id, 'verified', notes || '')
            }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DocumentVerification
