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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add,
  Gavel,
  Search,
  FilterList,
  Print,
  Schedule,
  CheckCircle,
  Cancel,
  PlayArrow
} from '@mui/icons-material'
import { apiRequest } from '../utils/api'

// Hardcoded incident types per Katarungang Pambarangay categories
const INCIDENT_CATEGORIES = {
  'Offenses Against Persons': [
    'Physical Injury',
    'Unjust Vexation',
    'Grave Threats',
    'Alarming and Scandal'
  ],
  'Offenses Against Property': [
    'Theft (Petty)',
    'Malicious Mischief',
    'Estafa (Swindling)',
    'Trespassing'
  ],
  'Civil & Family Disputes': [
    'Collection of Sum of Money',
    'Ejectment',
    'Boundary Dispute',
    'Family Dispute'
  ],
  'Community & Ordinance': [
    'Curfew Violation',
    'Noise Barrage',
    'Illegal Parking',
    'Waste Management',
    'Stray Animals'
  ]
}

const SITIOS = ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP']

const Blotter = () => {
  const [blotterCases, setBlotterCases] = useState([])
  const [residents, setResidents] = useState([])
  const [sitios, setSitios] = useState([])
  const [openWizard, setOpenWizard] = useState(false)
  const [openSummonsDialog, setOpenSummonsDialog] = useState(false)
  const [openResolutionDialog, setOpenResolutionDialog] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Wizard states
  const [activeStep, setActiveStep] = useState(0)
  const [wizardData, setWizardData] = useState({
    complainantDetails: { name: '', address: '', contact: '', idProof: '' },
    respondentDetails: { name: '', address: '', alias: '', contact: '' },
    incidentType: '',
    narrative: '',
    locationSitio: '',
    dateTimeIncident: new Date().toISOString().slice(0, 16)
  })

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sitioFilter, setSitioFilter] = useState('')

  // Resolution form
  const [resolutionData, setResolutionData] = useState({
    hearingDate: '',
    outcomeNotes: '',
    outcome: ''
  })

  useEffect(() => {
    fetchBlotterCases()
    fetchResidents()
    fetchSitios()
  }, [])

  const fetchBlotterCases = async () => {
    try {
      const response = await apiRequest('blotter')
      const data = await response.json()
      setBlotterCases(data)
    } catch (error) {
      console.error('Error fetching blotter cases:', error)
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await apiRequest('residents')
      const data = await response.json()
      setResidents(data)
    } catch (error) {
      console.error('Error fetching residents:', error)
    }
  }

  const fetchSitios = async () => {
    try {
      const response = await apiRequest('sitios')
      const data = await response.json()
      setSitios(data)
    } catch (error) {
      console.error('Error fetching sitios:', error)
    }
  }

  const generateCaseNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    // In a real app, you'd query the database for the next sequence number
    const sequence = String(blotterCases.length + 1).padStart(4, '0')
    return `BLOT-${year}-${month}-${sequence}`
  }

  const handleWizardNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleWizardBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleWizardSubmit = async () => {
    try {
      const caseNumber = generateCaseNumber()
      const payload = {
        Case_Number: caseNumber,
        Complainant_Details: JSON.stringify(wizardData.complainantDetails),
        Respondent_Details: wizardData.respondentDetails.name ? JSON.stringify(wizardData.respondentDetails) : null,
        Incident_Type: wizardData.incidentType,
        Narrative: wizardData.narrative,
        DateTime_Incident: wizardData.dateTimeIncident,
        Location_Sitio: wizardData.locationSitio,
        Status: 'Pending'
      }

      const response = await apiRequest('blotter', {
        method: 'POST',
        body: payload
      })

      if (response.ok) {
        fetchBlotterCases()
        setOpenWizard(false)
        setActiveStep(0)
        setWizardData({
          complainantDetails: { name: '', address: '', contact: '', idProof: '' },
          respondentDetails: { name: '', address: '', alias: '', contact: '' },
          incidentType: '',
          narrative: '',
          locationSitio: '',
          dateTimeIncident: new Date().toISOString().slice(0, 16)
        })
        setSnackbar({ open: true, message: 'Blotter case created successfully! PDF extract will be generated.', severity: 'success' })

        // Auto-print blotter extract (in real app, this would trigger PDF generation)
        handlePrintBlotterExtract(caseNumber)
      }
    } catch (error) {
      console.error('Error saving blotter case:', error)
      setSnackbar({ open: true, message: 'Error creating blotter case.', severity: 'error' })
    }
  }

  const handlePrintBlotterExtract = (caseNumber) => {
    // In a real implementation, this would generate and print a PDF
    console.log(`Printing Blotter Extract for case: ${caseNumber}`)
    // For demo purposes, we'll just show an alert
    alert(`Blotter Extract PDF generated for Case #${caseNumber}`)
  }

  const handleIssueSummons = async (caseData) => {
    try {
      const hearingDate = new Date()
      hearingDate.setDate(hearingDate.getDate() + 7) // Schedule for next week

      const response = await apiRequest(`blotter/${caseData.Case_Number}`, {
        method: 'PUT',
        body: {
          Status: 'Scheduled for Mediation',
          Hearing_Schedule: hearingDate.toISOString().slice(0, 16)
        }
      })

      if (response.ok) {
        fetchBlotterCases()
        setOpenSummonsDialog(false)
        setSnackbar({ open: true, message: 'Summons issued successfully! KP Form #9 generated.', severity: 'success' })
      }
    } catch (error) {
      console.error('Error issuing summons:', error)
      setSnackbar({ open: true, message: 'Error issuing summons.', severity: 'error' })
    }
  }

  const handleResolution = async () => {
    try {
      let newStatus = 'Ongoing'
      if (resolutionData.outcome === 'settled') {
        newStatus = 'Amicably Settled'
      } else if (resolutionData.outcome === 'failed') {
        newStatus = 'Certificate to File Action Issued'
      }

      const response = await apiRequest(`blotter/${selectedCase.Case_Number}`, {
        method: 'PUT',
        body: {
          Status: newStatus,
          Hearing_Schedule: resolutionData.hearingDate,
          resolution_notes: resolutionData.outcomeNotes
        }
      })

      if (response.ok) {
        fetchBlotterCases()
        setOpenResolutionDialog(false)
        setSelectedCase(null)
        setResolutionData({ hearingDate: '', outcomeNotes: '', outcome: '' })
        setSnackbar({ open: true, message: `Case ${newStatus.toLowerCase()}.`, severity: 'success' })
      }
    } catch (error) {
      console.error('Error updating case resolution:', error)
      setSnackbar({ open: true, message: 'Error updating case resolution.', severity: 'error' })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning'
      case 'Scheduled for Mediation': return 'info'
      case 'Amicably Settled': return 'success'
      case 'Certificate to File Action Issued': return 'error'
      case 'Dismissed': return 'default'
      case 'Ongoing': return 'primary'
      default: return 'default'
    }
  }

  const getIncidentTypeOptions = () => {
    return Object.entries(INCIDENT_CATEGORIES).flatMap(([category, options]) =>
      options.map(option => ({ value: option, label: `${category}: ${option}` }))
    )
  }

  // Filtered and searched blotter cases
  const filteredBlotterCases = useMemo(() => {
    return blotterCases.filter((case_) => {
      // Search term filter
      const searchMatch = !searchTerm ||
        case_.Case_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.Incident_Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.parse(case_.Complainant_Details || '{}').name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.parse(case_.Respondent_Details || '{}').name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.Location_Sitio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.Narrative?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const statusMatch = !statusFilter || case_.Status === statusFilter

      // Sitio filter
      const sitioMatch = !sitioFilter || case_.Location_Sitio === sitioFilter

      return searchMatch && statusMatch && sitioMatch
    })
  }, [blotterCases, searchTerm, statusFilter, sitioFilter])

  const wizardSteps = ['Intake (The Report)', 'The Summons', 'Resolution (The Outcome)']

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
          Blotter & Incident Reporting
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenWizard(true)}>
          File a Complaint
        </Button>
      </Box>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1 }} />
          Search & Filter Cases
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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
              placeholder="Search by case #, incident type, names..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{
                  minWidth: 200,
                  '& .MuiSelect-select': {
                    fontSize: '0.875rem',
                    padding: '8px 14px',
                  }
                }}
              >
                <MenuItem value="">
                  <Box sx={{ fontSize: '0.875rem' }}>All Statuses</Box>
                </MenuItem>
                <MenuItem value="Pending">
                  <Box sx={{ fontSize: '0.875rem' }}>Pending</Box>
                </MenuItem>
                <MenuItem value="Scheduled for Mediation">
                  <Box sx={{ fontSize: '0.875rem', whiteSpace: 'normal' }}>Scheduled for Mediation</Box>
                </MenuItem>
                <MenuItem value="Amicably Settled">
                  <Box sx={{ fontSize: '0.875rem', whiteSpace: 'normal' }}>Amicably Settled</Box>
                </MenuItem>
                <MenuItem value="Certificate to File Action Issued">
                  <Box sx={{ fontSize: '0.875rem', whiteSpace: 'normal' }}>Certificate to File Action Issued</Box>
                </MenuItem>
                <MenuItem value="Dismissed">
                  <Box sx={{ fontSize: '0.875rem' }}>Dismissed</Box>
                </MenuItem>
                <MenuItem value="Ongoing">
                  <Box sx={{ fontSize: '0.875rem' }}>Ongoing</Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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
                {SITIOS.map((sitio) => (
                  <MenuItem key={sitio} value={sitio}>
                    <Box sx={{ fontSize: '0.875rem' }}>{sitio}</Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setSitioFilter('')
              }}
              disabled={!searchTerm && !statusFilter && !sitioFilter}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredBlotterCases.length} of {blotterCases.length} cases
          </Typography>
        </Box>
      </Paper>

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
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBlotterCases.map((case_, index) => {
              const complainant = JSON.parse(case_.Complainant_Details || '{}')
              const respondent = JSON.parse(case_.Respondent_Details || '{}')
              return (
                <TableRow key={`${case_.Case_Number}-${index}`}>
                  <TableCell>{case_.Case_Number}</TableCell>
                  <TableCell>{case_.Incident_Type}</TableCell>
                  <TableCell>{complainant.name}</TableCell>
                  <TableCell>{respondent.name || 'N/A'}</TableCell>
                  <TableCell>{case_.Location_Sitio}</TableCell>
                  <TableCell>
                    <Chip
                      label={case_.Status}
                      color={getStatusColor(case_.Status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(case_.DateTime_Incident).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {case_.Status === 'Pending' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Schedule />}
                          onClick={() => {
                            setSelectedCase(case_)
                            setOpenSummonsDialog(true)
                          }}
                        >
                          Issue Summons
                        </Button>
                      )}
                      {(case_.Status === 'Scheduled for Mediation' || case_.Status === 'Ongoing') && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          onClick={() => {
                            setSelectedCase(case_)
                            setOpenResolutionDialog(true)
                          }}
                        >
                          Resolution
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => handlePrintBlotterExtract(case_.Case_Number)}
                      >
                        Print
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3-Step Wizard Dialog */}
      <Dialog open={openWizard} onClose={() => setOpenWizard(false)} maxWidth="md" fullWidth>
        <DialogTitle>File a Complaint - Katarungang Pambarangay</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
            {wizardSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Step 1: Intake (The Report)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide the details of your complaint (The "Sumbong")
              </Typography>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Complainant Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={wizardData.complainantDetails.name}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          complainantDetails: { ...wizardData.complainantDetails, name: e.target.value }
                        })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={wizardData.complainantDetails.contact}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          complainantDetails: { ...wizardData.complainantDetails, contact: e.target.value }
                        })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={wizardData.complainantDetails.address}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          complainantDetails: { ...wizardData.complainantDetails, address: e.target.value }
                        })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="ID Proof (Voter ID, Driver's License, etc.)"
                        value={wizardData.complainantDetails.idProof}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          complainantDetails: { ...wizardData.complainantDetails, idProof: e.target.value }
                        })}
                        required
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Respondent Details (Optional)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={wizardData.respondentDetails.name}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          respondentDetails: { ...wizardData.respondentDetails, name: e.target.value }
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Alias (if any)"
                        value={wizardData.respondentDetails.alias}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          respondentDetails: { ...wizardData.respondentDetails, alias: e.target.value }
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={wizardData.respondentDetails.address}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          respondentDetails: { ...wizardData.respondentDetails, address: e.target.value }
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={wizardData.respondentDetails.contact}
                        onChange={(e) => setWizardData({
                          ...wizardData,
                          respondentDetails: { ...wizardData.respondentDetails, contact: e.target.value }
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Incident Type</InputLabel>
                    <Select
                      value={wizardData.incidentType}
                      onChange={(e) => setWizardData({ ...wizardData, incidentType: e.target.value })}
                      label="Incident Type"
                    >
                      {getIncidentTypeOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Location (Sitio)</InputLabel>
                    <Select
                      value={wizardData.locationSitio}
                      onChange={(e) => setWizardData({ ...wizardData, locationSitio: e.target.value })}
                      label="Location (Sitio)"
                    >
                      {SITIOS.map((sitio) => (
                        <MenuItem key={sitio} value={sitio}>{sitio}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Narrative (The Sumbong - Describe what happened)"
                value={wizardData.narrative}
                onChange={(e) => setWizardData({ ...wizardData, narrative: e.target.value })}
                required
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                label="Date & Time of Incident"
                type="datetime-local"
                value={wizardData.dateTimeIncident}
                onChange={(e) => setWizardData({ ...wizardData, dateTimeIncident: e.target.value })}
                required
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">Step 2: The Summons (Katarungang Pambarangay)</Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                This step is handled by the Barangay Administration.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once your complaint is filed, the Barangay will issue a summons (KP Form #9) to the respondent,
                inviting them to the Barangay Hall for mediation.
              </Typography>
              <Alert severity="info" sx={{ mt: 3 }}>
                <strong>Next:</strong> The Barangay Secretary will schedule a hearing date and issue the summons.
              </Alert>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">Step 3: Resolution (The Outcome)</Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                This step is handled by the Lupon Tagapamayapa (Peace Panel).
              </Typography>
              <Typography variant="body2" color="text.secondary">
                During the hearing, the Lupon will attempt to mediate between parties.
                If successful, the case will be amicably settled. If not, a Certificate to File Action will be issued.
              </Typography>
              <Alert severity="success" sx={{ mt: 3 }}>
                <strong>Outcome:</strong> Either amicable settlement or referral to court/PNP.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={activeStep === 0} onClick={handleWizardBack}>
            Back
          </Button>
          <Button onClick={() => setOpenWizard(false)}>
            Cancel
          </Button>
          {activeStep === wizardSteps.length - 1 ? (
            <Button onClick={handleWizardSubmit} variant="contained">
              Submit Complaint
            </Button>
          ) : (
            <Button onClick={handleWizardNext} variant="contained">
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Summons Dialog */}
      <Dialog open={openSummonsDialog} onClose={() => setOpenSummonsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Summons - KP Form #9</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Issue summons for Case #{selectedCase?.Case_Number}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This will generate a KP Form #9 summons inviting the respondent to the Barangay Hall for mediation.
          </Typography>
          <Alert severity="info">
            A hearing will be scheduled for 7 days from now.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSummonsDialog(false)}>Cancel</Button>
          <Button onClick={() => handleIssueSummons(selectedCase)} variant="contained" startIcon={<Schedule />}>
            Issue Summons
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={openResolutionDialog} onClose={() => setOpenResolutionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Case Resolution - Hearing Panel</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Resolution for Case #{selectedCase?.Case_Number}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hearing Date"
                type="datetime-local"
                value={resolutionData.hearingDate}
                onChange={(e) => setResolutionData({ ...resolutionData, hearingDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Outcome</InputLabel>
                <Select
                  value={resolutionData.outcome}
                  onChange={(e) => setResolutionData({ ...resolutionData, outcome: e.target.value })}
                  label="Outcome"
                >
                  <MenuItem value="settled">Amicably Settled</MenuItem>
                  <MenuItem value="failed">Failed/No Show - Issue CFA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Resolution Notes"
                value={resolutionData.outcomeNotes}
                onChange={(e) => setResolutionData({ ...resolutionData, outcomeNotes: e.target.value })}
                placeholder="Describe the outcome of the hearing and mediation process..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setResolutionData({ ...resolutionData, outcome: 'settled' })}
              disabled={resolutionData.outcome !== 'settled'}
            >
              Settled - Archive Case
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setResolutionData({ ...resolutionData, outcome: 'failed' })}
              disabled={resolutionData.outcome !== 'failed'}
            >
              Failed - Issue CFA
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResolutionDialog(false)}>Cancel</Button>
          <Button onClick={handleResolution} variant="contained">
            Submit Resolution
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Blotter
