import React, { useState, useEffect, useMemo } from 'react'
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
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  People,
  Search,
  FilterList,
  ExpandMore,
  QrCode,
  FamilyRestroom,
  CloudUpload,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

const Residents = () => {
  const [residents, setResidents] = useState([])
  const [households, setHouseholds] = useState([])
  const [sitios, setSitios] = useState([])
  const [open, setOpen] = useState(false)
  const [openHousehold, setOpenHousehold] = useState(false)
  const [openBulkImport, setOpenBulkImport] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [duplicateCheck, setDuplicateCheck] = useState(null)
  const [bulkImportResult, setBulkImportResult] = useState(null)

  const [formData, setFormData] = useState({
    household_id: '',
    relation_to_head: 'Head',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    birthdate: '',
    gender: 'Male',
    civil_status: 'Single',
    occupation: '',
    income_estimate: 0,
    mobile_number: '',
    voter_status: 'Non-Registered',
    date_arrival: new Date().toISOString().split('T')[0],
    is_4ps: false,
    is_pwd: false,
    is_solo_parent: false,
    is_out_of_school_youth: false,
    disability_type: ''
  })

  const [householdFormData, setHouseholdFormData] = useState({
    Household_Number: '',
    Sitio_ID: '',
    Street_Address: '',
    Household_Type: 'Nuclear'
  })

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [sitioFilter, setSitioFilter] = useState('')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('')
  const [residencyFilter, setResidencyFilter] = useState('')

  useEffect(() => {
    fetchResidents()
    fetchHouseholds()
    fetchSitios()
  }, [])

  const fetchResidents = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (sitioFilter) params.append('sitio_id', sitioFilter)
      if (residencyFilter) params.append('residency_status', residencyFilter)
      if (vulnerabilityFilter === 'vulnerable') params.append('show_vulnerable', 'true')

      const response = await apiRequest(`residents?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Convert MySQL boolean values (0/1) to proper JavaScript booleans
        const processedResidents = (data.data || data).map(resident => ({
          ...resident,
          Is_4Ps: Boolean(resident.Is_4Ps),
          Is_PWD: Boolean(resident.Is_PWD),
          Is_Senior: Boolean(resident.Is_Senior),
          Is_Solo_Parent: Boolean(resident.Is_Solo_Parent),
          Is_Out_of_School_Youth: Boolean(resident.Is_Out_of_School_Youth)
        }))
        setResidents(processedResidents)
      }
    } catch (error) {
      console.error('Error fetching residents:', error)
    }
  }

  const fetchHouseholds = async () => {
    try {
      const response = await apiRequest('households')
      if (response.ok) {
        const data = await response.json()
        setHouseholds(data)
      }
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const fetchSitios = async () => {
    try {
      const response = await apiRequest('sitios')
      if (response.ok) {
        const data = await response.json()
        setSitios(data)
      }
    } catch (error) {
      console.error('Error fetching sitios:', error)
    }
  }

  const checkDuplicate = async () => {
    if (!formData.first_name || !formData.last_name || !formData.birthdate) return

    try {
      const response = await apiRequest('residents/check-duplicate', {
        method: 'POST',
        body: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          birthdate: formData.birthdate
        }
      })

      if (response.ok) {
        const result = await response.json()
        setDuplicateCheck(result)
      }
    } catch (error) {
      console.error('Error checking duplicates:', error)
    }
  }

  const handleOpenDialog = (resident = null) => {
    if (resident) {
      setEditing(resident)
      setFormData({
        household_id: resident.Household_ID || '',
        relation_to_head: resident.Relation_to_Head || 'Head',
        first_name: resident.First_Name || '',
        middle_name: resident.Middle_Name || '',
        last_name: resident.Last_Name || '',
        suffix: resident.Suffix || '',
        birthdate: resident.Birthdate ? resident.Birthdate.split('T')[0] : '',
        gender: resident.Gender || 'Male',
        civil_status: resident.Civil_Status || 'Single',
        occupation: resident.Occupation || '',
        income_estimate: resident.Income_Estimate || 0,
        mobile_number: resident.Mobile_Number || '',
        voter_status: resident.Voter_Status || 'Non-Registered',
        date_arrival: resident.Date_Arrival ? resident.Date_Arrival.split('T')[0] : new Date().toISOString().split('T')[0],
        is_4ps: resident.Is_4Ps || false,
        is_pwd: resident.Is_PWD || false,
        is_solo_parent: resident.Is_Solo_Parent || false,
        is_out_of_school_youth: resident.Is_Out_of_School_Youth || false,
        disability_type: resident.Disability_Type || ''
      })
    } else {
      setEditing(null)
      setFormData({
        household_id: '',
        relation_to_head: 'Head',
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        birthdate: '',
        gender: 'Male',
        civil_status: 'Single',
        occupation: '',
        income_estimate: 0,
        mobile_number: '',
        voter_status: 'Non-Registered',
        date_arrival: new Date().toISOString().split('T')[0],
        is_4ps: false,
        is_pwd: false,
        is_solo_parent: false,
        is_out_of_school_youth: false,
        disability_type: ''
      })
    }
    setDuplicateCheck(null)
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditing(null)
    setDuplicateCheck(null)
  }

  const handleSave = async () => {
    try {
      const endpoint = editing ? `residents/${editing.Resident_ID}` : 'residents'
      const method = editing ? 'put' : 'post'

      const response = await apiRequest(endpoint, {
        method,
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        fetchResidents()
        handleCloseDialog()
        alert(`${editing ? 'Updated' : 'Created'} resident: ${result.resident_id || 'Success'}`)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving resident:', error)
      alert('Error saving resident: ' + error.message)
    }
  }

  const handleArchive = async (residentId) => {
    const reason = prompt('Enter departure reason:')
    if (!reason) return

    try {
      const response = await apiRequest(`residents/${residentId}/archive`, {
        method: 'put',
        body: {
          departure_reason: reason,
          departure_date: new Date().toISOString()
        }
      })

      if (response.ok) {
        fetchResidents()
        alert('Resident archived successfully')
      } else {
        alert('Error archiving resident')
      }
    } catch (error) {
      console.error('Error archiving resident:', error)
      alert('Error archiving resident: ' + error.message)
    }
  }

  const handleBulkImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      // For file uploads, we need to use fetch directly since apiRequest expects JSON
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/residents/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      })

      const result = await response.json()
      setBulkImportResult(result)

      if (response.ok) {
        fetchResidents()
        setTimeout(() => setOpenBulkImport(false), 3000)
      }
    } catch (error) {
      console.error('Error in bulk import:', error)
      setBulkImportResult({ error: error.message })
    }
  }

  const generateQR = async (residentId) => {
    try {
      const response = await apiRequest(`residents/${residentId}/generate-qr`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`QR Code generated: ${result.qr_code}`)
        // In a real app, this would open a print dialog or download the ID
        window.open(`/print-id/${result.qr_code}`, '_blank')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('Error generating QR code')
    }
  }

  const getHouseholdMembers = async (householdId) => {
    try {
      const response = await apiRequest(`households/${householdId}/members`)
      if (response.ok) {
        const data = await response.json()
        // Convert MySQL boolean values (0/1) to proper JavaScript booleans for household members
        const processedHousehold = {
          ...data,
          members: data.members?.map(member => ({
            ...member,
            Is_4Ps: Boolean(member.Is_4Ps),
            Is_PWD: Boolean(member.Is_PWD),
            Is_Senior: Boolean(member.Is_Senior),
            Is_Solo_Parent: Boolean(member.Is_Solo_Parent),
            Is_Out_of_School_Youth: Boolean(member.Is_Out_of_School_Youth)
          }))
        }
        setSelectedHousehold(processedHousehold)
      }
    } catch (error) {
      console.error('Error fetching household members:', error)
    }
  }

  // Filtered and searched residents
  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      // Search term filter
      const searchMatch = !searchTerm ||
        `${resident.First_Name} ${resident.Middle_Name} ${resident.Last_Name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.Household_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.sitio_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.Occupation?.toLowerCase().includes(searchTerm.toLowerCase())

      // Gender filter
      const genderMatch = !genderFilter || resident.Gender === genderFilter

      // Sitio filter
      const sitioMatch = !sitioFilter || resident.sitio_name === sitioFilter

      // Vulnerability filter
      const vulnerabilityMatch = !vulnerabilityFilter ||
        (vulnerabilityFilter === 'vulnerable' && resident.Vulnerability_Score > 0) ||
        (vulnerabilityFilter === 'senior' && resident.Is_Senior) ||
        (vulnerabilityFilter === 'pwd' && resident.Is_PWD) ||
        (vulnerabilityFilter === '4ps' && resident.Is_4Ps) ||
        (vulnerabilityFilter === 'solo_parent' && resident.Is_Solo_Parent) ||
        (vulnerabilityFilter === 'osy' && resident.Is_Out_of_School_Youth)

      return searchMatch && genderMatch && sitioMatch && vulnerabilityMatch
    })
  }, [residents, searchTerm, genderFilter, sitioFilter, vulnerabilityFilter])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          Resident Profiling & RBIM
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setOpenBulkImport(true)}>
            Bulk Import
          </Button>
          <Button variant="outlined" startIcon={<FamilyRestroom />} onClick={() => setOpenHousehold(true)}>
            Add Household
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Resident
          </Button>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Residents" />
        <Tab label="Households" />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Search and Filter Controls */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Search & Filter Residents
            </Typography>

            <Grid container spacing={2}>
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Search by name, household, sitio..."
                />
              </Grid>

              <Grid xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    label="Gender"
                    sx={{
                      minWidth: 120,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '8px 14px',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Box sx={{ fontSize: '0.875rem' }}>All</Box>
                    </MenuItem>
                    <MenuItem value="Male">
                      <Box sx={{ fontSize: '0.875rem' }}>Male</Box>
                    </MenuItem>
                    <MenuItem value="Female">
                      <Box sx={{ fontSize: '0.875rem' }}>Female</Box>
                    </MenuItem>
                    <MenuItem value="Other">
                      <Box sx={{ fontSize: '0.875rem' }}>Other</Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sitio</InputLabel>
                  <Select
                    value={sitioFilter}
                    onChange={(e) => setSitioFilter(e.target.value)}
                    label="Sitio"
                    sx={{
                      minWidth: 160,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '8px 14px',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Box sx={{ fontSize: '0.875rem' }}>All Sitios</Box>
                    </MenuItem>
                    {sitios.map((sitio) => (
                      <MenuItem key={sitio.id} value={sitio.name}>
                        <Box sx={{ fontSize: '0.875rem' }}>{sitio.name}</Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vulnerabilities</InputLabel>
                  <Select
                    value={vulnerabilityFilter}
                    onChange={(e) => setVulnerabilityFilter(e.target.value)}
                    label="Vulnerabilities"
                    sx={{
                      minWidth: 180,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '8px 14px',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Box sx={{ fontSize: '0.875rem' }}>All</Box>
                    </MenuItem>
                    <MenuItem value="vulnerable">
                      <Box sx={{ fontSize: '0.875rem' }}>Any Vulnerability</Box>
                    </MenuItem>
                    <MenuItem value="senior">
                      <Box sx={{ fontSize: '0.875rem' }}>Senior Citizens</Box>
                    </MenuItem>
                    <MenuItem value="pwd">
                      <Box sx={{ fontSize: '0.875rem' }}>PWD</Box>
                    </MenuItem>
                    <MenuItem value="4ps">
                      <Box sx={{ fontSize: '0.875rem' }}>4Ps Members</Box>
                    </MenuItem>
                    <MenuItem value="solo_parent">
                      <Box sx={{ fontSize: '0.875rem' }}>Solo Parents</Box>
                    </MenuItem>
                    <MenuItem value="osy">
                      <Box sx={{ fontSize: '0.875rem' }}>Out of School Youth</Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredResidents.length} of {residents.length} residents
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setGenderFilter('')
                  setSitioFilter('')
                  setVulnerabilityFilter('')
                  fetchResidents()
                }}
                disabled={!searchTerm && !genderFilter && !sitioFilter && !vulnerabilityFilter}
              >
                Clear Filters
              </Button>
            </Box>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Photo</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Household</TableCell>
                  <TableCell>Sitio</TableCell>
                  <TableCell>Vulnerabilities</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResidents.map((resident, index) => (
                  <TableRow key={`${resident.Resident_ID}-${index}`}>
                    <TableCell>
                      <Avatar src={resident.Profile_Photo_URL} alt="Profile">
                        {resident.First_Name?.[0]}{resident.Last_Name?.[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      {resident.First_Name} {resident.Middle_Name} {resident.Last_Name} {resident.Suffix}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {resident.Relation_to_Head} • {resident.Occupation}
                      </Typography>
                    </TableCell>
                    <TableCell>{resident.Age}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => getHouseholdMembers(resident.Household_ID)}
                      >
                        {resident.Household_Number}
                      </Button>
                    </TableCell>
                    <TableCell>{resident.sitio_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {resident.Is_Senior && <Chip label="Senior" size="small" color="primary" />}
                        {resident.Is_PWD && <Chip label="PWD" size="small" color="secondary" />}
                        {resident.Is_4Ps && <Chip label="4Ps" size="small" color="info" />}
                        {resident.Is_Solo_Parent && <Chip label="Solo Parent" size="small" color="warning" />}
                        {resident.Is_Out_of_School_Youth && <Chip label="OSY" size="small" color="error" />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={resident.Residency_Status}
                        color={resident.Residency_Status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(resident)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate QR ID">
                          <IconButton size="small" onClick={() => generateQR(resident.Resident_ID)}>
                            <QrCode />
                          </IconButton>
                        </Tooltip>
                        {resident.Residency_Status === 'Active' && (
                          <Tooltip title="Archive Resident">
                            <IconButton size="small" color="error" onClick={() => handleArchive(resident.Resident_ID)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Household Management</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Household #</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Sitio</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Head</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {households.map((household) => (
                  <TableRow key={household.Household_ID}>
                    <TableCell>{household.Household_Number}</TableCell>
                    <TableCell>{household.Street_Address}</TableCell>
                    <TableCell>{household.sitio_name}</TableCell>
                    <TableCell>{household.Household_Type}</TableCell>
                    <TableCell>{household.Total_Members}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => getHouseholdMembers(household.Household_ID)}>
                        View Family
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Household Members View */}
      {selectedHousehold && (
        <Dialog open={!!selectedHousehold} onClose={() => setSelectedHousehold(null)} maxWidth="md" fullWidth>
          <DialogTitle>Household Members - {selectedHousehold.household?.Household_Number}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {selectedHousehold.household?.Street_Address}, {selectedHousehold.household?.sitio_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedHousehold.household?.Household_Type} Family • {selectedHousehold.members?.length} members
            </Typography>

            {selectedHousehold.members?.map((member) => (
              <Card key={member.Resident_ID} sx={{ mb: 2 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={member.Profile_Photo_URL}>
                    {member.First_Name?.[0]}{member.Last_Name?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">
                      {member.First_Name} {member.Middle_Name} {member.Last_Name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.Relation_to_Head} • Age {member.Age} • {member.Occupation || 'No occupation'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {member.Is_Senior && <Chip label="Senior" size="small" color="primary" />}
                      {member.Is_PWD && <Chip label="PWD" size="small" color="secondary" />}
                      {member.Is_4Ps && <Chip label="4Ps" size="small" color="info" />}
                      {member.Is_Solo_Parent && <Chip label="Solo Parent" size="small" color="warning" />}
                    </Box>
                  </Box>
                  <Chip
                    label={member.Residency_Status}
                    color={member.Residency_Status === 'Active' ? 'success' : 'default'}
                  />
                </CardContent>
              </Card>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedHousehold(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add/Edit Resident Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Duplicate Check */}
            {!editing && formData.first_name && formData.last_name && formData.birthdate && (
              <Box sx={{ mb: 3 }}>
                <Button variant="outlined" onClick={checkDuplicate} sx={{ mb: 1 }}>
                  Check for Duplicates
                </Button>
                {duplicateCheck && (
                  <Alert severity={duplicateCheck.is_duplicate ? 'warning' : 'success'} sx={{ mt: 1 }}>
                    {duplicateCheck.message}
                    {duplicateCheck.duplicates?.length > 0 && (
                      <ul>
                        {duplicateCheck.duplicates.slice(0, 3).map((dup, idx) => (
                          <li key={idx}>
                            {dup.First_Name} {dup.Last_Name} ({dup.sitio_name}) - {dup.Residency_Status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Alert>
                )}
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Household</InputLabel>
                  <Select
                    value={formData.household_id}
                    onChange={(e) => setFormData({...formData, household_id: e.target.value})}
                    label="Household"
                    required
                  >
                    {households.map((household) => (
                      <MenuItem key={household.Household_ID} value={household.Household_ID}>
                        {household.Household_Number} - {household.Street_Address}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Relation to Head</InputLabel>
                  <Select
                    value={formData.relation_to_head}
                    onChange={(e) => setFormData({...formData, relation_to_head: e.target.value})}
                    label="Relation to Head"
                  >
                    <MenuItem value="Head">Head</MenuItem>
                    <MenuItem value="Spouse">Spouse</MenuItem>
                    <MenuItem value="Child">Child</MenuItem>
                    <MenuItem value="Relative">Relative</MenuItem>
                    <MenuItem value="Boarder">Boarder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </Grid>
              <Grid xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                />
              </Grid>
              <Grid xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </Grid>

              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
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
              </Grid>

              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Civil Status</InputLabel>
                  <Select
                    value={formData.civil_status}
                    onChange={(e) => setFormData({...formData, civil_status: e.target.value})}
                    label="Civil Status"
                  >
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Widowed">Widowed</MenuItem>
                    <MenuItem value="Separated">Separated</MenuItem>
                    <MenuItem value="Divorced">Divorced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Voter Status</InputLabel>
                  <Select
                    value={formData.voter_status}
                    onChange={(e) => setFormData({...formData, voter_status: e.target.value})}
                    label="Voter Status"
                  >
                    <MenuItem value="Registered">Registered</MenuItem>
                    <MenuItem value="Non-Registered">Non-Registered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Income"
                  type="number"
                  value={formData.income_estimate}
                  onChange={(e) => setFormData({...formData, income_estimate: parseFloat(e.target.value) || 0})}
                />
              </Grid>

              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Arrival"
                  type="date"
                  value={formData.date_arrival}
                  onChange={(e) => setFormData({...formData, date_arrival: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Vulnerabilities</Typography>
                <Grid container spacing={2}>
                  <Grid xs={6} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>4Ps Member</InputLabel>
                      <Select
                        value={formData.is_4ps}
                        onChange={(e) => setFormData({...formData, is_4ps: e.target.value === 'true'})}
                        label="4Ps Member"
                      >
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={6} sm={3}>
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
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Solo Parent</InputLabel>
                      <Select
                        value={formData.is_solo_parent}
                        onChange={(e) => setFormData({...formData, is_solo_parent: e.target.value === 'true'})}
                        label="Solo Parent"
                      >
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>OSY</InputLabel>
                      <Select
                        value={formData.is_out_of_school_youth}
                        onChange={(e) => setFormData({...formData, is_out_of_school_youth: e.target.value === 'true'})}
                        label="OSY"
                      >
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {formData.is_pwd && (
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Disability Type"
                    value={formData.disability_type}
                    onChange={(e) => setFormData({...formData, disability_type: e.target.value})}
                    placeholder="e.g., Mobility Impairment, Visual Impairment, etc."
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? 'Update' : 'Add'} Resident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Household Dialog */}
      <Dialog open={openHousehold} onClose={() => setOpenHousehold(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Household</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Household Number"
              value={householdFormData.Household_Number}
              onChange={(e) => setHouseholdFormData({...householdFormData, Household_Number: e.target.value})}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Sitio</InputLabel>
              <Select
                value={householdFormData.Sitio_ID}
                onChange={(e) => setHouseholdFormData({...householdFormData, Sitio_ID: e.target.value})}
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
              multiline
              rows={2}
              label="Street Address"
              value={householdFormData.Street_Address}
              onChange={(e) => setHouseholdFormData({...householdFormData, Street_Address: e.target.value})}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Household Type</InputLabel>
              <Select
                value={householdFormData.Household_Type}
                onChange={(e) => setHouseholdFormData({...householdFormData, Household_Type: e.target.value})}
                label="Household Type"
              >
                <MenuItem value="Nuclear">Nuclear</MenuItem>
                <MenuItem value="Extended">Extended</MenuItem>
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Boarding">Boarding</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHousehold(false)}>Cancel</Button>
          <Button onClick={async () => {
            try {
              const response = await apiRequest('households', {
                method: 'post',
                body: householdFormData
              })

              if (response.ok) {
                fetchHouseholds()
                setOpenHousehold(false)
                setHouseholdFormData({
                  Household_Number: '',
                  Sitio_ID: '',
                  Street_Address: '',
                  Household_Type: 'Nuclear'
                })
              }
            } catch (error) {
              console.error('Error creating household:', error)
            }
          }} variant="contained">
            Add Household
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={openBulkImport} onClose={() => setOpenBulkImport(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Import Residents</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Upload an Excel file (.xlsx) with resident data. The file should have columns matching the RBIM format.
            </Typography>

            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="bulk-import-file"
              type="file"
              onChange={handleBulkImport}
            />
            <label htmlFor="bulk-import-file">
              <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                Choose Excel File
              </Button>
            </label>

            {bulkImportResult && (
              <Box sx={{ mt: 3 }}>
                {bulkImportResult.error ? (
                  <Alert severity="error">
                    <Typography variant="body2">{bulkImportResult.error}</Typography>
                  </Alert>
                ) : (
                  <Alert severity="success">
                    <Typography variant="body2">
                      Import completed: {bulkImportResult.results?.imported || 0} imported,
                      {bulkImportResult.results?.skipped || 0} skipped,
                      {bulkImportResult.results?.errors?.length || 0} errors
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkImport(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Residents
