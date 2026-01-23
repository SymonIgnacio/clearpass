import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Autocomplete, Tooltip, FormControl, InputLabel, Select, MenuItem, ListSubheader, Paper, IconButton, Chip, CircularProgress, LinearProgress, Divider, Grid } from '@mui/material';
import { useAuth } from '../contexts/useAuth';
import { apiRequest } from '../utils/api';
import { Info, Delete, Upload, CloudUpload, Save, Restore, Close } from '@mui/icons-material';

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
};

const ResidentBlotterReport = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    incident_type: '',
    custom_incident_type: '',
    location: '',
    date_time: '',
    description: '',
    files: [],
    complainant_contact_method: '',
    complainant_address: '',
    complainant_id_type: '',
    complainant_id_number: '',
    respondent_name: '',
    respondent_alias: '',
    respondent_address: '',
    respondent_contact: '',
    respondent_resident_id: null
  });
  const [sitios, setSitios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [draftSaved, setDraftSaved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [residentResidents, setResidentResidents] = useState([]);

  const isGuest = user?.role === 13;
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const saveDraft = useCallback(() => {
    try {
      const { files: _files, ...dataToSave } = formData;
      if (dataToSave.incident_type || dataToSave.description) {
        localStorage.setItem('blotter_draft', JSON.stringify(dataToSave));
        setDraftSaved(true);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData]);

  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem('blotter_draft');
      if (draft) {
        const draftData = JSON.parse(draft);
        setDraftSaved(true);
        setFormData(prev => ({
          ...prev,
          ...draftData,
          files: []
        }));
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem('blotter_draft');
    setDraftSaved(false);
  }, []);

  const CONTACT_METHODS = [
    { value: 'email', label: 'Email' }
  ];

  const ID_TYPES = [
    { value: 'voters_id', label: "Voter's ID" },
    { value: 'pwd_id', label: 'PWD ID' },
    { value: 'senior_id', label: 'Senior Citizen ID' },
    { value: 'postal_id', label: 'Postal ID' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'passport', label: 'Passport' },
    { value: 'tin_id', label: 'TIN ID' },
    { value: 'school_id', label: 'School ID' },
    { value: 'company_id', label: 'Company ID' },
    { value: 'other', label: 'Other' }
  ];

  const incidentOptions = Object.entries(INCIDENT_CATEGORIES).flatMap(([category, options]) =>
    options.map(option => ({ category, label: option }))
  );
  incidentOptions.push({ category: 'Others', label: 'Others' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitiosRes, residentsRes, profileRes] = await Promise.all([
          apiRequest('/sitios'),
          apiRequest('/residents/public-list'),
          apiRequest('/resident-profile/profile')
        ]);

        if (sitiosRes.ok) {
          const sitiosData = await sitiosRes.json();
          setSitios(sitiosData);
        }

        if (residentsRes.ok) {
          const residentsData = await residentsRes.json();
          setResidentResidents(residentsData || []);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.data) {
            const { Street_Address, email } = profileData.data;
            // Auto-fill address and contact info
            setFormData(prev => ({
              ...prev,
              complainant_address: `${Street_Address || ''}`.trim(),
              complainant_contact_method: 'email', // Default to email
              email: email || prev.email // Ensure email is captured if needed for backend, though usually fetched from user
            }));
          }
        }
      } catch (error) {
        // Failed to fetch data - use empty array
      }
    };
    fetchData();
  }, []); // Remove unstable dependencies to prevent infinite loop

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setDraftSaved(false);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];

    selectedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setMessage({ type: 'error', text: `File "${file.name}" exceeds 10MB limit` });
        return;
      }

      if (formData.files.length + validFiles.length >= MAX_FILES) {
        setMessage({ type: 'error', text: `Maximum ${MAX_FILES} files allowed` });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
    }
  };

  const handleFileRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleResidentSelect = (field, resident) => {
    if (resident) {
      setFormData(prev => ({
        ...prev,
        [field]: resident.Resident_ID,
        [field === 'respondent_resident_id' ? 'respondent_name' : '']: resident.full_name,
        [field === 'respondent_resident_id' ? 'respondent_address' : '']: '', // Address not available in public list
        [field === 'respondent_resident_id' ? 'respondent_contact' : '']: '' // Contact not available in public list
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: null,
        [field === 'respondent_resident_id' ? 'respondent_name' : '']: '',
        [field === 'respondent_resident_id' ? 'respondent_address' : '']: '',
        [field === 'respondent_resident_id' ? 'respondent_contact' : '']: ''
      }));
    }
    setDraftSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) return;

    setLoading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const { date_time } = formData;
      let incident_date = null;
      let incident_time = null;

      if (date_time) {
        const dateObj = new Date(date_time);
        incident_date = dateObj.toISOString().split('T')[0];
        incident_time = dateObj.toTimeString().split(' ')[0].substring(0, 5);
      }

      const finalIncidentType = formData.incident_type === 'Others' ? formData.custom_incident_type : formData.incident_type;

      const fd = new FormData();
      fd.append('incident_type', finalIncidentType);
      fd.append('location_sitio', formData.location);
      if (incident_date) fd.append('incident_date', incident_date);
      if (incident_time) fd.append('incident_time', incident_time);
      fd.append('description_text', formData.description);

      if (formData.respondent_name) fd.append('respondent_name', formData.respondent_name);
      if (formData.respondent_alias) fd.append('respondent_alias', formData.respondent_alias);
      if (formData.respondent_address) fd.append('respondent_address', formData.respondent_address);
      if (formData.respondent_contact) fd.append('respondent_contact', formData.respondent_contact);
      if (formData.respondent_resident_id) fd.append('respondent_resident_id', formData.respondent_resident_id);

      fd.append('complainant_contact_method', formData.complainant_contact_method);
      fd.append('complainant_address', formData.complainant_address);
      if (formData.complainant_id_type) fd.append('complainant_id_type', formData.complainant_id_type);
      if (formData.complainant_id_number) fd.append('complainant_id_number', formData.complainant_id_number);

      formData.files.forEach((file) => {
        fd.append('images', file);
      });

      setUploadProgress(50);

      const response = await apiRequest('/blotter-requests', {
        method: 'POST',
        body: fd
      });

      setUploadProgress(100);

      if (response.ok) {
        clearDraft();
        setMessage({ type: 'success', text: 'Request submitted successfully. Our officers will review it.' });
        setFormData({
          incident_type: '',
          custom_incident_type: '',
          location: '',
          date_time: '',
          description: '',
          files: [],
          complainant_contact_method: 'email', // Reset to email default
          complainant_address: formData.complainant_address, // Keep address
          complainant_id_type: '',
          complainant_id_number: '',
          respondent_name: '',
          respondent_alias: '',
          respondent_address: '',
          respondent_contact: '',
          respondent_resident_id: null
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to file complaint' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to file complaint' });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getResidentOptions = () => {
    return residentResidents.map(r => ({
      id: r.Resident_ID,
      label: r.full_name, // Use full_name provided by backend
      resident: r
    }));
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">File Blotter Report</Typography>
            {draftSaved && (
              <Button
                size="small"
                startIcon={<Restore />}
                onClick={loadDraft}
                variant="outlined"
              >
                Load Draft
              </Button>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Submit your complaint online. Our officers will review and contact you.
          </Typography>

          {isGuest && (
            <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
              You are currently logged in as a Guest. Please verify your residency to file a blotter report.
            </Alert>
          )}

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>
          )}

          {uploadProgress > 0 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary">
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Your Contact Information</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              How should we contact you regarding this complaint?
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isGuest}>
                  <InputLabel id="contact-method-label">Preferred Contact Method</InputLabel>
                  <Select
                    labelId="contact-method-label"
                    name="complainant_contact_method"
                    value={formData.complainant_contact_method}
                    label="Preferred Contact Method"
                    onChange={handleChange}
                  >
                    {CONTACT_METHODS.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isGuest}>
                  <InputLabel id="id-type-label">ID Type</InputLabel>
                  <Select
                    labelId="id-type-label"
                    name="complainant_id_type"
                    value={formData.complainant_id_type}
                    label="ID Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {ID_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID Number (Optional)"
                  name="complainant_id_number"
                  value={formData.complainant_id_number}
                  onChange={handleChange}
                  disabled={isGuest}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Your Full Address"
                  name="complainant_address"
                  value={formData.complainant_address}
                  onChange={handleChange}
                  disabled={isGuest}
                  placeholder="Enter your complete address"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Respondent Details (Optional)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Who are you filing this complaint against? Leave blank if unknown.
            </Typography>

            <Autocomplete
              fullWidth
              disabled={isGuest}
              options={getResidentOptions()}
              getOptionLabel={(option) => option?.label || option || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={getResidentOptions().find(r => r.id === formData.respondent_resident_id) || null}
              onChange={(e, newValue) => handleResidentSelect('respondent_resident_id', newValue?.resident)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Resident (Optional)"
                  placeholder="Search by name..."
                  helperText="Search resident database, or enter details manually below"
                  sx={{ mb: 2 }}
                />
              )}
            />

            <TextField
              fullWidth
              label="Respondent Name (if not found above)"
              name="respondent_name"
              value={formData.respondent_name}
              onChange={handleChange}
              disabled={isGuest || !!formData.respondent_resident_id}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Alias (if any)"
                name="respondent_alias"
                value={formData.respondent_alias}
                onChange={handleChange}
                disabled={isGuest}
              />
              <TextField
                fullWidth
                label="Contact Number"
                name="respondent_contact"
                value={formData.respondent_contact}
                onChange={handleChange}
                disabled={isGuest}
              />
            </Box>

            <TextField
              fullWidth
              label="Respondent Address"
              name="respondent_address"
              value={formData.respondent_address}
              onChange={handleChange}
              disabled={isGuest}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Incident Type</Typography>

            <Autocomplete
              fullWidth
              disabled={isGuest}
              options={incidentOptions}
              groupBy={(option) => option.category}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.label === value.label}
              value={incidentOptions.find(opt => opt.label === formData.incident_type) || null}
              onChange={(event, newValue) => {
                if (newValue && newValue.label === 'Others') {
                  setFormData(prev => ({ ...prev, incident_type: 'Others', custom_incident_type: '' }));
                } else {
                  setFormData(prev => ({ ...prev, incident_type: newValue ? newValue.label : '', custom_incident_type: '' }));
                }
              }}
              renderInput={(params) => <TextField {...params} label="Incident Type" required fullWidth sx={{ mb: 2 }} />}
              renderGroup={(params) => (
                <li key={params.key}>
                  <ListSubheader
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      bgcolor: 'background.paper',
                      lineHeight: '48px',
                      zIndex: 1
                    }}
                  >
                    {params.group}
                  </ListSubheader>
                  <ul style={{ padding: 0 }}>{params.children}</ul>
                </li>
              )}
            />

            {formData.incident_type === 'Others' && (
              <TextField
                fullWidth
                label="Specify Incident Type"
                name="custom_incident_type"
                value={formData.custom_incident_type || ''}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />
            )}

            <FormControl fullWidth sx={{ mb: 2 }} disabled={isGuest}>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                name="location"
                value={formData.location}
                label="Location"
                onChange={handleChange}
                required
              >
                {sitios.map((sitio) => (
                  <MenuItem key={sitio.id} value={sitio.name}>
                    {sitio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date and Time of Incident"
              name="date_time"
              type="datetime-local"
              value={formData.date_time}
              onChange={handleChange}
              required
              disabled={isGuest}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
              disabled={isGuest}
              sx={{ mb: 2 }}
            />

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                textAlign: 'center',
                borderStyle: 'dashed',
                borderColor: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                hidden
                onChange={handleFileSelect}
                disabled={isGuest || formData.files.length >= MAX_FILES}
              />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Click to upload evidence files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Images, PDFs, Documents (Max {MAX_FILES} files, {MAX_FILE_SIZE / 1024 / 1024}MB each)
              </Typography>
            </Paper>

            {formData.files.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Uploaded Files ({formData.files.length}/{MAX_FILES})
                </Typography>
                {formData.files.map((file, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Upload fontSize="small" color="action" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {file.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${(file.size / 1024).toFixed(0)} KB`}
                        variant="outlined"
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleFileRemove(index)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              {isGuest ? (
                <Tooltip title="Complete verification to submit">
                  <span style={{ flex: 1 }}>
                    <Button type="submit" variant="contained" fullWidth disabled>
                      Submit Complaint
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={saveDraft}
                    disabled={isGuest || loading}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} /> : <CloudUpload />}
                    disabled={isGuest || loading}
                    sx={{ flex: 1 }}
                  >
                    {loading ? 'Submitting...' : 'Submit Complaint'}
                  </Button>
                </>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResidentBlotterReport;
