import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
  Paper,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material'
import {
  Person,
  CloudUpload,
  CheckCircle,
  Warning,
  Email,
  Phone,
  Home,
  Work
} from '@mui/icons-material'

const ResidentOpenRegister = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    birthdate: '',
    gender: 'Male',
    civil_status: 'Single',
    occupation: '',
    income_estimate: 0,
    email: '',
    mobile_number: '',
    street_address: '',
    sitio: '',
    voter_status: 'Non-Registered',
    is_4ps: false,
    is_pwd: false,
    is_solo_parent: false,
    is_out_of_school_youth: false,
    disability_type: '',
    documents: {},
    government_id: null
  })
  
  const [submitResult, setSubmitResult] = useState(null)

  const steps = [
    'Personal Information',
    'Contact & Address',
    'Identity Verification',
    'Vulnerabilities (Optional)',
    'Review & Submit'
  ]

  const handleDocumentUpload = (event, documentType) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed')
      return
    }

    if (documentType === 'government_id') {
      setFormData(prev => ({ ...prev, government_id: file }))
    } else {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: file
        }
      }))
    }
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.birthdate || !formData.email) {
        alert('Please fill in all required fields')
        return
      }

      if (!formData.government_id) {
        alert('Please upload a valid government ID')
        return
      }

      // Validate vulnerability documents
      const vulnerabilityChecks = [
        { field: 'is_4ps', docType: '4ps', name: '4Ps Member' },
        { field: 'is_pwd', docType: 'pwd', name: 'PWD' },
        { field: 'is_solo_parent', docType: 'solo_parent', name: 'Solo Parent' },
        { field: 'is_out_of_school_youth', docType: 'osy', name: 'Out of School Youth' }
      ]

      for (const check of vulnerabilityChecks) {
        if (formData[check.field] && !formData.documents[check.docType]) {
          alert(`Please upload supporting document for ${check.name} status.`)
          return
        }
      }

      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'documents' && key !== 'government_id') {
          submitData.append(key, formData[key])
        }
      })

      // Add government ID
      if (formData.government_id) {
        submitData.append('government_id', formData.government_id)
      }

      // Add document files
      Object.keys(formData.documents).forEach(docType => {
        if (formData.documents[docType]) {
          submitData.append(`document_${docType}`, formData.documents[docType])
        }
      })

      // Submit registration
      const response = await apiRequest('/residents/open-register', {
        method: 'POST',
        body: submitData
      })

      const result = await response.json()
      
      if (response.ok) {
        setSubmitResult({
          success: true,
          message: 'Registration submitted successfully! Your application is pending verification.',
          applicationId: result.application_id
        })
        setActiveStep(steps.length)
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Registration failed. Please try again.'
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitResult({
        success: false,
        message: 'Network error. Please check your connection and try again.'
      })
    }
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid xs={12} sm={3}>
              <TextField
                fullWidth
                label="First Name *"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <TextField
                fullWidth
                label="Last Name *"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <TextField
                fullWidth
                label="Suffix"
                value={formData.suffix}
                onChange={(e) => setFormData({...formData, suffix: e.target.value})}
                placeholder="Jr., Sr., III"
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                label="Birthdate *"
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid xs={12} sm={4}>
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
            <Grid xs={12} sm={4}>
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
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email /></InputAdornment>
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={formData.mobile_number}
                onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                placeholder="09XXXXXXXXX"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>
                }}
              />
            </Grid>
            <Grid xs={12} sm={8}>
              <TextField
                fullWidth
                label="Street Address *"
                value={formData.street_address}
                onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Home /></InputAdornment>
                }}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                label="Sitio *"
                value={formData.sitio}
                onChange={(e) => setFormData({...formData, sitio: e.target.value})}
                required
              />
            </Grid>
            <Grid xs={12} sm={8}>
              <TextField
                fullWidth
                label="Occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Work /></InputAdornment>
                }}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                label="Monthly Income (₱)"
                type="number"
                value={formData.income_estimate}
                onChange={(e) => setFormData({...formData, income_estimate: parseFloat(e.target.value) || 0})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₱</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        )

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Identity Verification Required:</strong> Upload a clear photo of your government-issued ID 
                (National ID, Driver's License, Passport, Voter's ID, SSS/GSIS ID)
              </Typography>
            </Alert>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <input
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
                id="government-id-upload"
                type="file"
                onChange={(e) => handleDocumentUpload(e, 'government_id')}
              />
              <label htmlFor="government-id-upload">
                <Button
                  variant="contained"
                  component="span"
                  size="large"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 2 }}
                >
                  Upload Government ID
                </Button>
              </label>
              {formData.government_id && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ✓ Government ID uploaded: {formData.government_id.name}
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Box>
        )

      case 3:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Optional:</strong> If you belong to any vulnerable or special categories, 
                please declare them here and upload supporting documents.
              </Typography>
            </Alert>
            <Grid container spacing={2}>
              <Grid xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>4Ps Member</InputLabel>
                  <Select
                    value={formData.is_4ps ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, is_4ps: e.target.value === 'true'})}
                    label="4Ps Member"
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </Select>
                </FormControl>
                {formData.is_4ps && (
                  <Box sx={{ mt: 1 }}>
                    <input
                      accept=".jpg,.jpeg,.png,.pdf"
                      style={{ display: 'none' }}
                      id="4ps-document"
                      type="file"
                      onChange={(e) => handleDocumentUpload(e, '4ps')}
                    />
                    <label htmlFor="4ps-document">
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        fullWidth
                        startIcon={<CloudUpload />}
                      >
                        Upload 4Ps ID
                      </Button>
                    </label>
                    {formData.documents?.['4ps'] && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                        ✓ Document uploaded
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>
              {/* Similar structure for PWD, Solo Parent, OSY */}
            </Grid>
          </Box>
        )

      case 4:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Review Your Information</Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Personal Information</Typography>
                <Typography variant="body2">
                  Name: {formData.first_name} {formData.middle_name} {formData.last_name} {formData.suffix}
                </Typography>
                <Typography variant="body2">
                  Birthdate: {formData.birthdate} | Gender: {formData.gender} | Civil Status: {formData.civil_status}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Contact & Address</Typography>
                <Typography variant="body2">Email: {formData.email}</Typography>
                <Typography variant="body2">Mobile: {formData.mobile_number || 'Not provided'}</Typography>
                <Typography variant="body2">Address: {formData.street_address}, {formData.sitio}</Typography>
              </CardContent>
            </Card>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Your registration will be reviewed by barangay officials. 
                You will receive an email notification once your account is verified and approved.
              </Typography>
            </Alert>
          </Box>
        )

      default:
        return null
    }
  }

  if (activeStep === steps.length) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {submitResult?.success ? (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'success.main' }}>
                Registration Submitted Successfully!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your application ID is: <strong>{submitResult.applicationId}</strong>
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Your registration is now pending verification. You will receive an email notification 
                  once your account is approved by barangay officials.
                </Typography>
              </Alert>
              <Button variant="contained" href="/resident/login">
                Go to Login Page
              </Button>
            </>
          ) : (
            <>
              <Warning sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
                Registration Failed
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {submitResult?.message}
              </Typography>
              <Button variant="contained" onClick={() => setActiveStep(0)}>
                Try Again
              </Button>
            </>
          )}
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
        Resident Registration
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {renderStepContent(index)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Submit Registration' : 'Continue'}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}

export default ResidentOpenRegister