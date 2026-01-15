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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'
import { Add, Description } from '@mui/icons-material'
import { apiRequest } from '../utils/api'
import SmartResidentSearch from '../components/SmartResidentSearch'

const Certificates = () => {
  const [certificates, setCertificates] = useState([])
  const [certificateTypes, setCertificateTypes] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [selectedResident, setSelectedResident] = useState(null)
  const [formData, setFormData] = useState({
    resident_id: '',
    certificate_type_id: '',
    certificate_type: '',
    purpose: ''
  })

  useEffect(() => {
    fetchCertificates()
    fetchCertificateTypes()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await apiRequest('certificates')
      const data = await response.json()
      setCertificates(data)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }
  }

  const fetchCertificateTypes = async () => {
    try {
      const response = await apiRequest('certificate-types')
      const data = await response.json()
      setCertificateTypes(data)
    } catch (error) {
      console.error('Error fetching certificate types:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.resident_id) {
      setError('Please select a resident')
      return
    }
    
    try {
      const response = await apiRequest('certificates', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        fetchCertificates()
        setOpen(false)
        setError('')
        setFormData({
            resident_id: '',
            certificate_type_id: '',
            certificate_type: '',
            purpose: ''
        })
        setSelectedResident(null)
      } else {
        setError(data.error || 'Failed to issue certificate')
      }
    } catch (error) {
      console.error('Error issuing certificate:', error)
      setError('Network error')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success'
      case 'Expired': return 'warning'
      case 'Revoked': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
          Certificate Issuance
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Issue Certificate
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Certificate #</TableCell>
              <TableCell>Resident</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Issued Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert, index) => (
              <TableRow key={`cert-${index}-${cert.control_no || cert.id || 'unknown'}`}>
                <TableCell>{cert.control_no || cert.certificate_number}</TableCell>
                <TableCell>{cert.resident_name}</TableCell>
                <TableCell>{cert.certificate_type}</TableCell>
                <TableCell>{cert.purpose}</TableCell>
                <TableCell>
                  <Chip
                    label={cert.status}
                    color={getStatusColor(cert.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(cert.date_issued || cert.issued_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue New Certificate</DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SmartResidentSearch
              label="Select Resident"
              required
              value={selectedResident}
              onChange={(resident) => {
                setSelectedResident(resident)
                setFormData({
                  ...formData,
                  resident_id: resident ? resident.id : ''
                })
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Certificate Type</InputLabel>
              <Select
                value={formData.certificate_type_id}
                onChange={(e) => {
                  const selectedType = certificateTypes.find(type => type.id === e.target.value)
                  setFormData({
                    ...formData,
                    certificate_type_id: e.target.value,
                    certificate_type: selectedType ? selectedType.name : ''
                  })
                }}
                label="Certificate Type"
                required
              >
                {certificateTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name} - ₱{type.fee} ({type.validity_days} days)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Certificates
