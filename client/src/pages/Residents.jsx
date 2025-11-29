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
import { Add, Edit, Delete, People } from '@mui/icons-material'

const Residents = () => {
  const [residents, setResidents] = useState([])
  const [sitios, setSitios] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    age: '',
    gender: '',
    sitio_id: '',
    is_senior: false,
    is_pwd: false,
    is_single_parent: false,
    employment_status: '',
    monthly_income: ''
  })

  useEffect(() => {
    fetchResidents()
    fetchSitios()
  }, [])

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

  const handleOpenDialog = (resident = null) => {
    if (resident) {
      setEditing(resident)
      setFormData({
        first_name: resident.first_name || '',
        last_name: resident.last_name || '',
        middle_name: resident.middle_name || '',
        age: resident.age || '',
        gender: resident.gender || '',
        sitio_id: resident.sitio_id || '',
        is_senior: resident.is_senior || false,
        is_pwd: resident.is_pwd || false,
        is_single_parent: resident.is_single_parent || false,
        employment_status: resident.employment_status || '',
        monthly_income: resident.monthly_income || ''
      })
    } else {
      setEditing(null)
      setFormData({
        first_name: '',
        last_name: '',
        middle_name: '',
        age: '',
        gender: '',
        sitio_id: '',
        is_senior: false,
        is_pwd: false,
        is_single_parent: false,
        employment_status: '',
        monthly_income: ''
      })
    }
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditing(null)
  }

  const handleSave = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/residents/${editing.id}` : '/api/residents'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        fetchResidents()
        handleCloseDialog()
      }
    } catch (error) {
      console.error('Error saving resident:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resident?')) {
      try {
        await fetch(`/api/residents/${id}`, { method: 'DELETE' })
        fetchResidents()
      } catch (error) {
        console.error('Error deleting resident:', error)
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          Resident Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Resident
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Sitio</TableCell>
              <TableCell>Vulnerabilities</TableCell>
              <TableCell>Income</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident) => (
              <TableRow key={resident.id}>
                <TableCell>
                  {resident.first_name} {resident.middle_name} {resident.last_name}
                </TableCell>
                <TableCell>{resident.age}</TableCell>
                <TableCell>{resident.gender}</TableCell>
                <TableCell>{resident.sitio_name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {resident.is_senior && <Chip label="Senior" size="small" color="primary" />}
                    {resident.is_pwd && <Chip label="PWD" size="small" color="secondary" />}
                    {resident.is_single_parent && <Chip label="Single Parent" size="small" color="info" />}
                  </Box>
                </TableCell>
                <TableCell>₱{resident.monthly_income || 0}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleOpenDialog(resident)} sx={{ mr: 1 }}>
                    <Edit />
                  </Button>
                  <Button size="small" color="error" onClick={() => handleDelete(resident.id)}>
                    <Delete />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Sitio</InputLabel>
                <Select
                  value={formData.sitio_id}
                  onChange={(e) => setFormData({...formData, sitio_id: e.target.value})}
                  label="Sitio"
                >
                  {sitios.map((sitio) => (
                    <MenuItem key={sitio.id} value={sitio.id}>{sitio.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Employment Status"
                value={formData.employment_status}
                onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
              />
              <TextField
                fullWidth
                label="Monthly Income"
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({...formData, monthly_income: e.target.value})}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Senior Citizen</InputLabel>
                <Select
                  value={formData.is_senior}
                  onChange={(e) => setFormData({...formData, is_senior: e.target.value === 'true'})}
                  label="Senior Citizen"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>PWD</InputLabel>
                <Select
                  value={formData.is_pwd}
                  onChange={(e) => setFormData({...formData, is_pwd: e.target.value === 'true'})}
                  label="PWD"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Single Parent</InputLabel>
                <Select
                  value={formData.is_single_parent}
                  onChange={(e) => setFormData({...formData, is_single_parent: e.target.value === 'true'})}
                  label="Single Parent"
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? 'Update' : 'Add'} Resident
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Residents
