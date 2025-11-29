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

const Certificates = () => {
  const [certificates, setCertificates] = useState([])
  const [residents, setResidents] = useState([])
  const [certificateTypes, setCertificateTypes] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    resident_id: '',
    certificate_type_id: '',
    certificate_type: '',
    purpose: ''
  })

  useEffect(() => {
    fetchCertificates()
    fetchResidents()
    fetchCertificateTypes()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates')
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/residents')
      if (response.ok) {
        const data = await response.json()
        setResidents(data)
      }
    } catch (error) {
      console.error('Error fetching residents:', error)
    }
  }

  const fetchCertificateTypes = async () => {
    try {
      const response = await fetch('/api/certificate-types')
      if (response.ok) {
        const data = await response.json()
        setCertificateTypes(data)
      }
    } catch (error) {
      console.error('Error fetching certificate types:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        fetchCertificates()
        setOpen(false)
        setError('')
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
            {certificates.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.certificate_number}</TableCell>
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
                <TableCell>{new Date(cert.issued_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue New Certificate</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Resident</InputLabel>
              <Select
                value={formData.resident_id}
                onChange={(e) => setFormData({...formData, resident_id: e.target.value})}
                label="Select Resident"
                required
              >
                {residents.map((resident) => (
                  <MenuItem key={resident.id} value={resident.id}>
                    {resident.first_name} {resident.last_name} - {resident.sitio_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
