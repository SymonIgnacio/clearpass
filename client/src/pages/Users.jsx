import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  Avatar,
  TablePagination,
  MenuItem,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material'
import People from '@mui/icons-material/People';
import Search from '@mui/icons-material/Search';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Pending from '@mui/icons-material/Pending';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import ErrorIcon from '@mui/icons-material/Error';
import Person from '@mui/icons-material/Person';
import SupervisorAccount from '@mui/icons-material/SupervisorAccount';
import Refresh from '@mui/icons-material/Refresh';
import Visibility from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterList from '@mui/icons-material/FilterList';
import Save from '@mui/icons-material/Save';
import Close from '@mui/icons-material/Close';
import { apiRequest } from '../utils/api'

const Users = ({ user }) => {
  // --- State: System Users (Existing) ---
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // --- State: Verification Requests (Existing) ---
  const [verificationRequests, setVerificationRequests] = useState([])
  
  // --- State: Resident Database (New) ---
  const [residentsList, setResidentsList] = useState([])
  const [residentsLoading, setResidentsLoading] = useState(false)
  const [residentsPage, setResidentsPage] = useState(0)
  const [residentsRowsPerPage, setResidentsRowsPerPage] = useState(10)
  const [residentsTotal, setResidentsTotal] = useState(0)
  const [residentSearch, setResidentSearch] = useState('')
  const [residentFilterSitio, setResidentFilterSitio] = useState('')
  
  // --- State: Shared/Common ---
  const [tabValue, setTabValue] = useState(0) // 0: Residents, 1: System Users, 2: Residency Verif, 3: Vuln Verif
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [households, setHouseholds] = useState([])
  const [sitios, setSitios] = useState([])

  // --- Dialogs ---
  const [reviewDialog, setReviewDialog] = useState({ open: false, type: '', data: null }) // For verification
  const [residentDialog, setResidentDialog] = useState({ open: false, mode: 'create', data: null }) // For Create/Edit Resident
  const [deleteDialog, setDeleteDialog] = useState({ open: false, data: null })
  const [reviewResidentDocuments, setReviewResidentDocuments] = useState([])
  const [reviewResidentDocumentsLoading, setReviewResidentDocumentsLoading] = useState(false)
  const [reviewResidentDocumentsError, setReviewResidentDocumentsError] = useState('')

  // --- Resident Form State ---
  const initialResidentState = {
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    mobile_number: '',
    birthdate: '',
    gender: 'Male',
    civil_status: 'Single',
    occupation: '',
    household_id: '',
    relation_to_head: 'Head',
    voter_status: 'Non-Registered',
    is_4ps: false,
    is_pwd: false,
    is_solo_parent: false,
    is_out_of_school_youth: false,
    disability_type: ''
  }
  const [residentForm, setResidentForm] = useState(initialResidentState)
  const [formErrors, setFormErrors] = useState({})

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchSitios()
    fetchHouseholds()
  }, [])

  useEffect(() => {
    if (tabValue === 0) fetchResidentsList()
    if (tabValue === 1) fetchUsers()
    if (tabValue === 2 || tabValue === 3) fetchVerificationRequests()
  }, [tabValue, residentsPage, residentsRowsPerPage, residentFilterSitio])

  // --- API Calls ---

  const fetchSitios = async () => {
    try {
      const response = await apiRequest('sitios')
      if (response.ok) {
        const data = await response.json()
        setSitios(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch sitios', err)
    }
  }

  const fetchHouseholds = async () => {
    try {
      const response = await apiRequest('households')
      if (response.ok) {
        const data = await response.json()
        setHouseholds(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch households', err)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await apiRequest('admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchVerificationRequests = async () => {
    try {
      const response = await apiRequest('admin/residents-verification')
      if (response.ok) {
        const data = await response.json()
        setVerificationRequests(data || [])
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error)
      setError('Failed to fetch requests')
    }
  }

  const fetchResidentDocumentsForReview = async (residentId) => {
    setReviewResidentDocumentsLoading(true)
    setReviewResidentDocumentsError('')
    try {
      const response = await apiRequest(`residents/${residentId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setReviewResidentDocuments(data || [])
      } else {
        setReviewResidentDocuments([])
        setReviewResidentDocumentsError('Failed to load documents')
      }
    } catch (error) {
      console.error('Error fetching resident documents:', error)
      setReviewResidentDocuments([])
      setReviewResidentDocumentsError('Failed to load documents')
    } finally {
      setReviewResidentDocumentsLoading(false)
    }
  }

  const openFileFromEndpoint = async (endpoint, fileName) => {
    try {
      const response = await apiRequest(endpoint)
      if (!response.ok) {
        setError('Failed to open file')
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
      setError('Error opening file')
    }
  }

  const fetchResidentsList = async () => {
    setResidentsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: residentsPage + 1,
        limit: residentsRowsPerPage,
        search: residentSearch,
        sitio_id: residentFilterSitio
      })
      
      const response = await apiRequest(`residents?${queryParams.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setResidentsList(result.data || [])
        if (result.pagination) {
          setResidentsTotal(result.pagination.total)
        }
      }
    } catch (error) {
      console.error('Error fetching residents list:', error)
      setError('Failed to fetch residents database')
    } finally {
      setResidentsLoading(false)
    }
  }

  // --- Handlers: Resident CRUD ---

  const handleSearchChange = (e) => {
    setResidentSearch(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setResidentsPage(0)
    fetchResidentsList()
  }

  const handleOpenResidentDialog = (mode, data = null) => {
    setResidentDialog({ open: true, mode, data })
    if (mode === 'edit' && data) {
      // Map data to form
      setResidentForm({
        first_name: data.First_Name || '',
        middle_name: data.Middle_Name || '',
        last_name: data.Last_Name || '',
        suffix: data.Suffix || '',
        email: data.Email || '',
        mobile_number: data.Mobile_Number || '',
        birthdate: data.Birthdate ? data.Birthdate.split('T')[0] : '',
        gender: data.Gender || 'Male',
        civil_status: data.Civil_Status || 'Single',
        occupation: data.Occupation || '',
        household_id: data.Household_ID || '',
        relation_to_head: data.Relation_to_Head || 'Head',
        voter_status: data.Voter_Status || 'Non-Registered',
        is_4ps: Boolean(data.Is_4Ps),
        is_pwd: Boolean(data.Is_PWD),
        is_solo_parent: Boolean(data.Is_Solo_Parent),
        is_out_of_school_youth: Boolean(data.Is_Out_of_School_Youth),
        disability_type: data.Disability_Type || ''
      })
    } else {
      setResidentForm(initialResidentState)
    }
    setFormErrors({})
  }

  const validateResidentForm = () => {
    const errors = {}
    if (!residentForm.first_name) errors.first_name = 'First name is required'
    if (!residentForm.last_name) errors.last_name = 'Last name is required'
    if (!residentForm.birthdate) errors.birthdate = 'Birthdate is required'
    if (!residentForm.household_id) errors.household_id = 'Household is required'
    if (!residentForm.email) errors.email = 'Email is required'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitResident = async () => {
    if (!validateResidentForm()) return

    try {
      const url = residentDialog.mode === 'create' ? 'residents' : `residents/${residentDialog.data.Resident_ID}`
      const method = residentDialog.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentForm)
      })

      if (response.ok) {
        setSuccess(`Resident ${residentDialog.mode === 'create' ? 'created' : 'updated'} successfully`)
        setResidentDialog({ open: false, mode: 'create', data: null })
        fetchResidentsList()
      } else {
        const err = await response.json()
        setError(err.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error saving resident:', error)
      setError('Network error')
    }
  }

  const handleDeleteResident = async () => {
    if (!deleteDialog.data) return

    try {
      const response = await apiRequest(`residents/${deleteDialog.data.Resident_ID}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Resident archived successfully')
        setDeleteDialog({ open: false, data: null })
        fetchResidentsList()
      } else {
        setError('Failed to archive resident')
      }
    } catch (error) {
      console.error('Error archiving resident:', error)
      setError('Network error')
    }
  }

  // --- Handlers: Verification ---

  const handleVerifyResident = async (residentId, verificationType) => {
    try {
      const response = await apiRequest(`admin/verify-resident/${residentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_type: verificationType })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(result.message)
        fetchVerificationRequests()
        setReviewDialog({ open: false, type: '', data: null })
        setReviewResidentDocuments([])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Verification failed')
      }
    } catch (error) {
      console.error('Error verifying resident:', error)
      setError('Network error occurred')
    }
  }

  const openReviewDialog = (resident, type) => {
    setReviewDialog({ open: true, type, data: resident })
    setReviewResidentDocuments([])
    setReviewResidentDocumentsError('')
    if (resident?.Resident_ID) {
      fetchResidentDocumentsForReview(resident.Resident_ID)
    }
  }

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, type: '', data: null })
    setReviewResidentDocuments([])
    setReviewResidentDocumentsError('')
  }

  // --- Computed Data ---
  
  const pendingResidency = verificationRequests.filter(r => r.Residency_Status === 'Pending')
  const pendingVulnerability = verificationRequests.filter(r => 
    (r.Is_4Ps || r.Is_PWD || r.Is_Senior || r.Is_Solo_Parent || r.Is_Out_of_School_Youth) && 
    !r.verified_at
  )

  const getUserInitials = (fullName) => {
    if (!fullName) return 'U'
    return fullName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)
  }

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 2: return 'warning'   // Captain
      case 3: return 'info'      // Secretary
      case 4: return 'success'   // Clerk
      case 1: return 'error'     // IT Admin
      case 6: return 'secondary' // Blotter Officer
      case 12: return 'primary'  // Resident
      default: return 'default'
    }
  }

  // --- Render Helpers ---

  const renderResidentForm = () => (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="First Name"
          value={residentForm.first_name}
          onChange={(e) => setResidentForm({...residentForm, first_name: e.target.value})}
          error={!!formErrors.first_name}
          helperText={formErrors.first_name}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Middle Name"
          value={residentForm.middle_name}
          onChange={(e) => setResidentForm({...residentForm, middle_name: e.target.value})}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Last Name"
          value={residentForm.last_name}
          onChange={(e) => setResidentForm({...residentForm, last_name: e.target.value})}
          error={!!formErrors.last_name}
          helperText={formErrors.last_name}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={residentForm.email}
          onChange={(e) => setResidentForm({...residentForm, email: e.target.value})}
          error={!!formErrors.email}
          helperText={formErrors.email}
          disabled={residentDialog.mode === 'edit'}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Birthdate"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={residentForm.birthdate}
          onChange={(e) => setResidentForm({...residentForm, birthdate: e.target.value})}
          error={!!formErrors.birthdate}
          helperText={formErrors.birthdate}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={residentForm.gender}
            label="Gender"
            onChange={(e) => setResidentForm({...residentForm, gender: e.target.value})}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!formErrors.household_id}>
          <InputLabel>Household</InputLabel>
          <Select
            value={residentForm.household_id}
            label="Household"
            onChange={(e) => setResidentForm({...residentForm, household_id: e.target.value})}
          >
            {households.map(h => (
              <MenuItem key={h.Household_ID} value={h.Household_ID}>
                #{h.Household_Number} - {h.Street_Address}
              </MenuItem>
            ))}
          </Select>
          {formErrors.household_id && <FormHelperText>{formErrors.household_id}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
         <FormControl fullWidth>
          <InputLabel>Relation to Head</InputLabel>
          <Select
            value={residentForm.relation_to_head}
            label="Relation to Head"
            onChange={(e) => setResidentForm({...residentForm, relation_to_head: e.target.value})}
          >
            <MenuItem value="Head">Head</MenuItem>
            <MenuItem value="Spouse">Spouse</MenuItem>
            <MenuItem value="Child">Child</MenuItem>
            <MenuItem value="Relative">Relative</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Vulnerabilities</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['is_4ps', 'is_pwd', 'is_solo_parent', 'is_out_of_school_youth'].map((key) => (
             <Chip
                key={key}
                label={key.replace('is_', '').replace(/_/g, ' ').toUpperCase()}
                onClick={() => setResidentForm({...residentForm, [key]: !residentForm[key]})}
                color={residentForm[key] ? 'primary' : 'default'}
                variant={residentForm[key] ? 'filled' : 'outlined'}
             />
          ))}
        </Box>
      </Grid>
    </Grid>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          Resident & User Management
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => {
            fetchResidentsList()
            fetchUsers()
            fetchVerificationRequests()
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Resident Database" icon={<People />} iconPosition="start" />
        <Tab label={`System Accounts (${users.length})`} icon={<SupervisorAccount />} iconPosition="start" />
        <Tab label={`Residency Verif (${pendingResidency.length})`} icon={<Pending />} iconPosition="start" />
        <Tab label={`Vuln Verif (${pendingVulnerability.length})`} icon={<VerifiedUser />} iconPosition="start" />
      </Tabs>

      {/* --- TAB 0: RESIDENT DATABASE --- */}
      {tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
           <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
             <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, display: 'flex', gap: '16px' }}>
                <TextField
                  fullWidth
                  placeholder="Search residents..."
                  value={residentSearch}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                  }}
                  size="small"
                />
                <Button type="submit" variant="contained">Search</Button>
             </form>
             <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Sitio</InputLabel>
                <Select
                  value={residentFilterSitio}
                  label="Filter by Sitio"
                  onChange={(e) => setResidentFilterSitio(e.target.value)}
                >
                  <MenuItem value="">All Sitios</MenuItem>
                  {sitios.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
             </FormControl>
             <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenResidentDialog('create')}
             >
                Add Resident
             </Button>
           </Box>

           <TableContainer sx={{ overflowX: 'auto' }}>
             <Table sx={{ minWidth: 700 }}>
               <TableHead>
                 <TableRow>
                   <TableCell>Name / ID</TableCell>
                   <TableCell>Address</TableCell>
                   <TableCell>Details</TableCell>
                   <TableCell>Status</TableCell>
                   <TableCell>Actions</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {residentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                 ) : residentsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No residents found</TableCell>
                    </TableRow>
                 ) : (
                    residentsList.map(r => (
                      <TableRow key={r.Resident_ID}>
                        <TableCell>
                          <Typography variant="subtitle2">{r.First_Name} {r.Last_Name}</Typography>
                          <Typography variant="caption" color="textSecondary">{r.Resident_ID}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{r.sitio_name || 'No Sitio'}</Typography>
                          <Typography variant="caption" color="textSecondary">HH #{r.Household_Number}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {r.Gender}, {new Date().getFullYear() - new Date(r.Birthdate).getFullYear()} yrs
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {r.Is_4Ps === 1 && <Chip label="4Ps" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                            {r.Is_PWD === 1 && <Chip label="PWD" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                            {r.Is_Senior === 1 && <Chip label="Snr" size="small" color="info" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          </Box>
                        </TableCell>
                        <TableCell>
                           <Chip 
                              label={r.Residency_Status} 
                              color={r.Residency_Status === 'Active' ? 'success' : 'default'}
                              size="small"
                           />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenResidentDialog('edit', r)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, data: r })}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
           </TableContainer>
           <TablePagination
             component="div"
             count={residentsTotal}
             page={residentsPage}
             onPageChange={(e, newPage) => setResidentsPage(newPage)}
             rowsPerPage={residentsRowsPerPage}
             onRowsPerPageChange={(e) => {
               setResidentsRowsPerPage(parseInt(e.target.value, 10))
               setResidentsPage(0)
             }}
           />
        </Paper>
      )}

      {/* --- TAB 1: SYSTEM USERS --- */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
           {/* Existing Users Table Logic */}
           <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.filter(u => `${u.full_name} ${u.username}`.toLowerCase().includes(residentSearch.toLowerCase())).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(u.role_id) + '.main' }}>
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
                        label={u.role_name || `Role ${u.role_id}`}
                        color={getRoleColor(u.role_id)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{u.email || 'No email'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active ? 'Active' : 'Inactive'}
                        color={u.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* --- TAB 2 & 3: VERIFICATION --- */}
      {(tabValue === 2 || tabValue === 3) && (
         <Grid container spacing={2}>
           {(tabValue === 2 ? pendingResidency : pendingVulnerability).map((resident) => (
             <Grid item xs={12} md={6} lg={4} key={resident.Resident_ID}>
                <Card>
                  <CardContent>
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Person sx={{ mr: 1, color: tabValue === 2 ? 'warning.main' : 'info.main' }} />
                        <Typography variant="h6">{resident.First_Name} {resident.Last_Name}</Typography>
                     </Box>
                     <Typography variant="body2" sx={{ mb: 1 }}>ID: {resident.Resident_ID}</Typography>
                     <Typography variant="body2" sx={{ mb: 2 }}>
                        📍 Sitio: {resident.sitio_name || 'N/A'}
                     </Typography>
                     <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small"
                          onClick={() => handleVerifyResident(resident.Resident_ID, tabValue === 2 ? 'residency' : 'vulnerability')}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => openReviewDialog(resident, tabValue === 2 ? 'residency' : 'vulnerability')}
                        >
                          View
                        </Button>
                     </Box>
                  </CardContent>
                </Card>
             </Grid>
           ))}
           {(tabValue === 2 ? pendingResidency : pendingVulnerability).length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No pending requests found.</Alert>
              </Grid>
           )}
         </Grid>
      )}

      {/* --- DIALOGS --- */}
      
      {/* Create/Edit Resident Dialog */}
      <Dialog open={residentDialog.open} onClose={() => setResidentDialog({ ...residentDialog, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>{residentDialog.mode === 'create' ? 'Add New Resident' : 'Edit Resident'}</DialogTitle>
        <DialogContent>
           {renderResidentForm()}
        </DialogContent>
        <DialogActions>
           <Button onClick={() => setResidentDialog({ ...residentDialog, open: false })}>Cancel</Button>
           <Button variant="contained" onClick={handleSubmitResident}>Save Resident</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, data: null })}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          Are you sure you want to archive resident <b>{deleteDialog.data?.First_Name} {deleteDialog.data?.Last_Name}</b>?
          This will mark them as "Transferred Out".
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, data: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteResident}>Archive</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog (Existing Logic) */}
      <Dialog open={reviewDialog.open} onClose={closeReviewDialog} maxWidth="md" fullWidth>
        <DialogTitle>Verification Details</DialogTitle>
        <DialogContent>
          {reviewDialog.data && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth label="Name" value={`${reviewDialog.data.First_Name} ${reviewDialog.data.Last_Name}`} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Sitio" value={reviewDialog.data.sitio_name || ''} InputProps={{ readOnly: true }} /></Grid>
              </Grid>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Uploaded Documents</Typography>
                  {reviewResidentDocumentsError && (
                    <Alert severity="error" sx={{ mb: 1 }}>{reviewResidentDocumentsError}</Alert>
                  )}
                  {reviewResidentDocumentsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : reviewResidentDocuments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No uploaded documents found for this resident.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>File</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reviewResidentDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{doc.document_type}</TableCell>
                            <TableCell>{doc.file_name}</TableCell>
                            <TableCell>
                              <Chip label={doc.verification_status} size="small" />
                            </TableCell>
                            <TableCell>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Open File">
                                <IconButton
                                  size="small"
                                  aria-label="Open File"
                                  onClick={() => openFileFromEndpoint(`residents/${reviewDialog.data.Resident_ID}/documents/${doc.id}/download`, doc.file_name)}
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
           <Button onClick={closeReviewDialog}>Close</Button>
           <Button 
             variant="contained" 
             color="success"
             onClick={() => handleVerifyResident(reviewDialog.data?.Resident_ID, reviewDialog.type)}
           >
             Verify
           </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users
