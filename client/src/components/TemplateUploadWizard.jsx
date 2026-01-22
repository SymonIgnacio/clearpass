import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CloudUpload, Warning, CheckCircle, Info } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const SYSTEM_FIELDS = [
  { value: 'resident_name', label: 'Full Name (First Middle Last)' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'middle_name', label: 'Middle Name' },
  { value: 'address', label: 'Full Address' },
  { value: 'age', label: 'Age' },
  { value: 'civil_status', label: 'Civil Status' },
  { value: 'gender', label: 'Gender' },
  { value: 'place_of_birth', label: 'Place of Birth' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'control_number', label: 'Control Number (Auto)' },
  { value: 'date_issued', label: 'Date Issued (Auto)' },
  { value: 'valid_until', label: 'Valid Until (Auto)' },
  { value: 'ctc_no', label: 'CTC Number (Auto)' },
  { value: 'or_no', label: 'OR Number (Auto)' },
  { value: 'issued_at', label: 'Issued At (Location)' },
  { value: 'prepared_by', label: 'Prepared By (Staff Name)' },
  { value: 'captain_name', label: 'Captain Name' },
  { value: 'secretary_name', label: 'Secretary Name' },
];

const TemplateUploadWizard = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [documentType, setDocumentType] = useState('custom');

  // Analysis State
  const [placeholders, setPlaceholders] = useState([]);
  const [fieldConfig, setFieldConfig] = useState({});

  const steps = ['Upload File', 'Configure Fields', 'Review & Save'];

  const handleFileChange = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill name if empty
      if (!templateName) {
        const name = selectedFile.name.replace('.docx', '').replace(/_/g, ' ');
        setTemplateName(name);
        setDisplayName(name);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file || !templateName) {
      setError('Please provide a file and template name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('template_file', file);

      const response = await apiRequest('/templates/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const foundPlaceholders = data.placeholders || [];
        setPlaceholders(foundPlaceholders);

        // Initial config guessing
        const initialConfig = {};
        foundPlaceholders.forEach(ph => {
          const cleanPh = ph.replace(/[{}]/g, '');
          // Try to match with system fields
          const isSystem = SYSTEM_FIELDS.some(sf => sf.value === cleanPh);

          initialConfig[ph] = {
            key: cleanPh,
            source: isSystem ? 'system' : 'user',
            system_field: isSystem ? cleanPh : '',
            label: cleanPh.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Title Case
            type: 'text',
            required: true,
          };
        });

        setFieldConfig(initialConfig);
        setActiveStep(1);
      } else {
        throw new Error('Failed to analyze template');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (placeholder, field, value) => {
    setFieldConfig(prev => ({
      ...prev,
      [placeholder]: {
        ...prev[placeholder],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare final required_fields JSON
      // Only include fields that are 'user' source
      const requiredFields = Object.values(fieldConfig)
        .filter(config => config.source === 'user')
        .map(config => ({
          key: config.key,
          label: config.label,
          type: config.type,
          required: config.required,
        }));

      const formData = new FormData();
      formData.append('template_file', file);
      formData.append('template_name', templateName);
      formData.append('display_name', displayName);
      formData.append(
        'document_type',
        documentType === 'custom' ? templateName.toLowerCase().replace(/\s+/g, '_') : documentType
      );
      formData.append('is_custom', true);
      formData.append('required_fields', JSON.stringify(requiredFields));

      const response = await apiRequest('/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label='Template Name (Internal ID)'
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              margin='normal'
              helperText='Unique identifier (e.g. medico_legal_cert)'
            />
            <TextField
              fullWidth
              label='Display Name (Resident Facing)'
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              margin='normal'
              helperText='What residents will see (e.g. Medico-Legal Certificate)'
            />

            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                mt: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: file ? '#f0f9ff' : 'transparent',
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
              component='label'
            >
              <input type='file' hidden accept='.docx' onChange={handleFileChange} />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant='h6'>
                {file ? file.name : 'Click to Upload .docx Template'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Only Word documents (.docx) are supported for dynamic parsing
              </Typography>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ mb: 2 }}>
              We found <b>{placeholders.length}</b> placeholders in your document. Configure how
              they should be filled.
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Placeholder</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Configuration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {placeholders.map(ph => {
                    const config = fieldConfig[ph];
                    return (
                      <TableRow key={ph}>
                        <TableCell>
                          <Chip label={ph} size='small' />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={config.source}
                            onChange={e => handleConfigChange(ph, 'source', e.target.value)}
                            size='small'
                            fullWidth
                          >
                            <MenuItem value='system'>System (Auto-fill)</MenuItem>
                            <MenuItem value='user'>User Input</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {config.source === 'system' ? (
                            <Select
                              value={config.system_field}
                              onChange={e => handleConfigChange(ph, 'system_field', e.target.value)}
                              size='small'
                              fullWidth
                              displayEmpty
                            >
                              <MenuItem value='' disabled>
                                Select Field
                              </MenuItem>
                              {SYSTEM_FIELDS.map(f => (
                                <MenuItem key={f.value} value={f.value}>
                                  {f.label}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                label='Label'
                                value={config.label}
                                onChange={e => handleConfigChange(ph, 'label', e.target.value)}
                                size='small'
                                sx={{ width: '50%' }}
                              />
                              <Select
                                value={config.type}
                                onChange={e => handleConfigChange(ph, 'type', e.target.value)}
                                size='small'
                                sx={{ width: '40%' }}
                              >
                                <MenuItem value='text'>Text</MenuItem>
                                <MenuItem value='date'>Date</MenuItem>
                                <MenuItem value='number'>Number</MenuItem>
                                <MenuItem value='textarea'>Long Text</MenuItem>
                              </Select>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant='h6' gutterBottom>
              Ready to Save
            </Typography>
            <Typography variant='body1'>
              <b>{templateName}</b> will be created.
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Residents will be asked to provide:
            </Typography>
            <Box
              sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}
            >
              {Object.values(fieldConfig)
                .filter(c => c.source === 'user')
                .map(c => (
                  <Chip key={c.key} label={c.label} color='primary' variant='outlined' />
                ))}
              {Object.values(fieldConfig).filter(c => c.source === 'user').length === 0 && (
                <Chip label='None (All Auto-filled)' color='default' />
              )}
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Add New Certificate Template</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: '#fff0f0',
              color: '#d32f2f',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Warning sx={{ mr: 1 }} />
            {error}
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent(activeStep)
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='inherit'>
          Cancel
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {activeStep > 0 && <Button onClick={() => setActiveStep(prev => prev - 1)}>Back</Button>}
        {activeStep === 0 && (
          <Button variant='contained' onClick={handleAnalyze} disabled={!file || !templateName}>
            Analyze File
          </Button>
        )}
        {activeStep === 1 && (
          <Button variant='contained' onClick={() => setActiveStep(2)}>
            Next
          </Button>
        )}
        {activeStep === 2 && (
          <Button variant='contained' onClick={handleSave} color='success'>
            Save Template
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TemplateUploadWizard;
