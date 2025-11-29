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
  MenuItem
} from '@mui/material'
import { Add, Gavel } from '@mui/icons-material'

const Blotter = () => {
  const [blotterCases, setBlotterCases] = useState([])
  const [residents, setResidents] = useState([])
  const [sitios, setSitios] = useState([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    complainant_name: '',
    respondent_id: '',
    incident_type: '',
    location: '',
    sitio_id: '',
    description: '',
    status: 'Pending',
    severity: 'Low'
  })

  useEffect(() => {
    fetchBlotterCases()
    fetchResidents()
    fetchSitios()
  }, [])

  const fetchBlotterCases = async () => {
    try {
      const response = await fetch('/api/blotter')
      if (response.ok) {
        const data = await response.json()
        setBlotterCases(data)
      }
    } catch (error) {
      console.error('Error fetching blotter cases:', error)
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

  const fetchSitios = async () => {
    try {
      const response = await fetch('/api/sitios')
      if (response.ok) {
        const data = await response.json()
        setSitios(data)
      }
    } catch (error) {
      console.error('Error fetching sitios:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/blotter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchBlotterCases()
        setOpen(false)
      }
    } catch (error) {
      console.error('Error saving blotter case:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning'
      case 'Resolved': return 'success'
      case 'Forwarded to Lupon': return 'info'
      case 'Dismissed': return 'default'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
          Blotter Records
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Log Incident
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case #</TableCell>
              <TableCell>Incident Type</TableCell>
              <TableCell>Complainant</TableCell>
              <TableCell>Respondent</TableCell>
              <TableCell>Sitio</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blotterCases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.case_number}</TableCell>
                <TableCell>{case_.incident_type}</TableCell>
                <TableCell>{case_.complainant_name}</TableCell>
                <TableCell>{case_.respondent_name || 'N/A'}</TableCell>
                <TableCell>{case_.sitio_name}</TableCell>
                <TableCell>
                  <Chip
                    label={case_.status}
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{case_.severity}</TableCell>
                <TableCell>{new Date(case_.date_filed).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Log New Incident</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Complainant Name"
              value={formData.complainant_name}
              onChange={(e) => setFormData({...formData, complainant_name: e.target.value})}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Respondent (Optional)</InputLabel>
              <Select
                value={formData.respondent_id}
                onChange={(e) => setFormData({...formData, respondent_id: e.target.value})}
                label="Respondent (Optional)"
              >
                <MenuItem value="">No respondent</MenuItem>
                {residents.map((resident) => (
                  <MenuItem key={resident.id} value={resident.id}>
                    {resident.first_name} {resident.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Incident Type"
              value={formData.incident_type}
              onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Sitio</InputLabel>
              <Select
                value={formData.sitio_id}
                onChange={(e) => setFormData({...formData, sitio_id: e.target.value})}
                label="Sitio"
                required
              >
                {sitios.map((sitio) => (
                  <MenuItem key={sitio.id} value={sitio.id}>{sitio.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Log Incident
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Blotter
