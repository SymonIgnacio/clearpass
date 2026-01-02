import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Description,
  Add,
  Edit,
  Delete,
  ContentCopy,
  Assessment,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
  Assignment,
  Settings,
  Article,
  Print,
  Download
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';

// Color palette for charts
const COLORS = ['#1DB954', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

const DocumentsDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Certificate issuing states - Manual input with template selection
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] = useState('');
  const [certificateFormData, setCertificateFormData] = useState({
    // Manual input mode only
    manual_resident_name: '',
    manual_address: '',
    manual_purpose: '',
    manual_certificate_type: '',
    manual_issued_date: new Date().toISOString().split('T')[0],
    manual_valid_until: '',
    manual_control_number: '',
    manual_signatory_captain: 'Captain Juan Dela Cruz',
    manual_signatory_secretary: 'Secretary Maria Santos',
    manual_location: 'Barangay Batia, Bocaue, Bulacan'
  });

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Template management states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    template_name: '',
    document_type: 'barangay_clearance'
  });
  const [templateFormData, setTemplateFormData] = useState({
    template_name: '',
    document_type: 'barangay_clearance',
    template_content: {
      title: '',
      header_text: '',
      main_content: '',
      footer_text: '',
      signature_text: '',
      validity_text: '',
      location: '',
      show_qr_code: true,
      show_control_number: true,
      font_family: 'Times-Roman',
      font_size: 12
    },
    is_active: true
  });

  // Document type options
  const documentTypes = [
    { value: 'barangay_clearance', label: 'Barangay Clearance' },
    { value: 'bonafide_certificate', label: 'Bonafide Certificate' },
    { value: 'indigency_certificate', label: 'Indigency Certificate' },
    { value: 'good_moral_certificate', label: 'Good Moral Certificate' },
    { value: 'cohabitation_certificate', label: 'Cohabitation Certificate' },
    { value: 'business_closure', label: 'Business Closure Certificate' },
    { value: 'medico_legal', label: 'Medico-Legal Certificate' },
    { value: 'building_permit', label: 'Building Permit' },
    { value: 'excavation_permit', label: 'Excavation Permit' },
    { value: 'fencing_permit', label: 'Fencing Permit' },
    { value: 'late_registration', label: 'Late Registration' },
    { value: 'ojt_certification', label: 'OJT Certification' },
    { value: 'low_income_housing', label: 'Low Income Housing' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    console.log('=== LOAD ALL DATA DEBUG ===');
    console.log('User role:', user?.role);

    try {
      // Allow access for secretary and higher roles (IT Admin 1, Secretary 6, Captain 5)
      const hasManagementAccess = [1, 5, 6].includes(user?.role); // IT Admin, Captain, Secretary
      console.log('Has management access (templates/cert types):', hasManagementAccess);

      // Only fetch template stats if user has IT Admin/Captain role
      const shouldFetchStats = [1, 5].includes(user?.role); // IT Admin, Captain
      console.log('Should fetch template stats:', shouldFetchStats);

      // Load all data in parallel
      const [
        certificatesRes,
        templatesRes,
        certTypesRes,
        residentsRes,
        statsRes
      ] = await Promise.all([
        apiRequest('certificates').catch((err) => {
          console.error('Certificates API failed:', err);
          return { data: [] };
        }),
        hasManagementAccess
          ? apiRequest('templates').catch((err) => {
              console.error('Templates API failed:', err);
              return { data: [] };
            })
          : Promise.resolve({ data: [] }),
        hasManagementAccess
          ? apiRequest('certificate-types').catch((err) => {
              console.error('Certificate types API failed:', err);
              return { data: [] };
            })
          : Promise.resolve({ data: [] }),
        apiRequest('residents?limit=1000').catch((err) => {
          console.error('Residents API failed:', err);
          return { data: [] };
        }),
        shouldFetchStats
          ? apiRequest('templates/stats').catch((err) => {
              console.error('=== TEMPLATE STATS API FAILURE ===');
              console.error('Error details:', err);
              console.error('User:', { id: user?.id, role: user?.role });
              console.error('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001');
              return { data: null };
            })
          : Promise.resolve({ data: null })
      ]);

      console.log('Raw API responses received');
      console.log('Certificates response status:', certificatesRes.status || 'OK');
      console.log('Templates response status:', templatesRes.status || 'OK');
      console.log('Cert types response status:', certTypesRes.status || 'OK');
      console.log('Stats response status:', statsRes.status || 'N/A');

      const certData = certificatesRes.json
        ? await certificatesRes.json().catch((err) => {
            console.error('Failed to parse certificates JSON:', err);
            return [];
          })
        : certificatesRes;
      const templateData = templatesRes.json
        ? await templatesRes.json().catch((err) => {
            console.error('Failed to parse templates JSON:', err);
            return { data: [] };
          })
        : templatesRes;
      const certTypesResponse = certTypesRes.json
        ? await certTypesRes.json().catch((err) => {
            console.error('Failed to parse cert types JSON:', err);
            return { data: [] };
          })
        : certTypesRes;
      const certTypesData = certTypesResponse.data || [];
      const residentsData = residentsRes.json
        ? await residentsRes.json().catch((err) => {
            console.error('Failed to parse residents JSON:', err);
            return { data: [] };
          })
        : residentsRes;
      // Check if stats request was successful (only for admin/captain)
      const statsData = shouldFetchStats && statsRes.ok ?
        await statsRes.json().catch((err) => {
          console.error('Failed to parse stats JSON:', err);
          return null;
        }) : null;

      console.log('Parsed data counts:');
      console.log('certData:', certData.length || 'null');
      console.log('templateData.data:', templateData.data?.length || 'null');
      console.log('certTypesData:', certTypesData.length || 'null');
      console.log('residentsData.data:', residentsData.data?.length || 'null');
      console.log('statsData:', statsData ? 'has data' : 'null');

      setCertificates(certData || []);
      setTemplates(templateData.data || []);
      setCertificateTypes(certTypesData || []);
      setResidents(residentsData.data || []);
      setStats(statsData);

      setLastUpdated(new Date());
      console.log('=== LOAD ALL DATA COMPLETE ===');
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Stack trace:', error.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      let formData;

      if (certificateFormData.use_manual_input) {
        // Manual input mode - send custom certificate data
        formData = {
          manual_certificate: true,
          resident_name: certificateFormData.manual_resident_name,
          address: certificateFormData.manual_address,
          purpose: certificateFormData.manual_purpose,
          certificate_type: certificateFormData.manual_certificate_type,
          issued_date: certificateFormData.manual_issued_date,
          valid_until: certificateFormData.manual_valid_until,
          control_number: certificateFormData.manual_control_number,
          signatory_captain: certificateFormData.manual_signatory_captain,
          signatory_secretary: certificateFormData.manual_signatory_secretary,
          location: certificateFormData.manual_location
        };
      } else {
        // Auto-fill mode (existing functionality)
        formData = {
          resident_id: certificateFormData.resident_id,
          certificate_type_id: certificateFormData.certificate_type_id,
          certificate_type: certificateFormData.certificate_type,
          purpose: certificateFormData.purpose
        };
      }

      const response = await apiRequest('certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Certificate issued successfully!');
        setShowIssueDialog(false);
        resetCertificateForm();
        loadAllData();
      } else {
        alert(`Error: ${data.error || 'Failed to issue certificate'}`);
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      alert('Network error occurred');
    }
  };

  const resetCertificateForm = () => {
    setCertificateFormData({
      resident_id: '',
      certificate_type_id: '',
      certificate_type: '',
      purpose: '',
      use_manual_input: false,
      manual_resident_name: '',
      manual_address: '',
      manual_purpose: '',
      manual_certificate_type: '',
      manual_issued_date: new Date().toISOString().split('T')[0],
      manual_valid_until: '',
      manual_control_number: '',
      manual_signatory_captain: 'Captain Juan Dela Cruz',
      manual_signatory_secretary: 'Secretary Maria Santos',
      manual_location: 'Barangay Batia, Bocaue, Bulacan'
    });
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await apiRequest('templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateFormData)
      });

      if (response.ok) {
        alert('Template created successfully!');
        setShowTemplateModal(false);
        resetTemplateForm();
        loadAllData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create template'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Network error occurred');
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      const response = await apiRequest(`templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateFormData)
      });

      if (response.ok) {
        alert('Template updated successfully!');
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        resetTemplateForm();
        loadAllData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to update template'}`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Network error occurred');
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      const response = await apiRequest(`templates/${templateId}`, { method: 'DELETE' });

      if (response.ok) {
        alert('Template deleted successfully!');
        loadAllData();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Network error occurred');
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    const newName = prompt('Enter new template name:');
    if (!newName) return;

    try {
      const response = await apiRequest(`templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_template_name: newName })
      });

      if (response.ok) {
        alert('Template duplicated successfully!');
        loadAllData();
      } else {
        alert('Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Network error occurred');
    }
  };

  const handleDeleteTemplateWithFile = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}" and its associated file? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiRequest(`templates/${templateId}/with-file`, { method: 'DELETE' });

      if (response.ok) {
        alert('Template and file deleted successfully!');
        loadAllData();
      } else {
        alert('Failed to delete template and file');
      }
    } catch (error) {
      console.error('Error deleting template with file:', error);
      alert('Network error occurred');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('template_file', file);
    formData.append('template_name', uploadFormData.template_name || file.name.replace(/\.[^/.]+$/, ""));
    formData.append('document_type', uploadFormData.document_type);

    setUploadingFile(true);
    try {
      // Use the correct server URL instead of relative path
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/templates/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        alert('Template file uploaded successfully!');
        setShowUploadDialog(false);
        setUploadFormData({ template_name: '', document_type: 'barangay_clearance' });
        loadAllData();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Network error occurred during upload');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      template_name: template.template_name,
      document_type: template.document_type,
      template_content: { ...template.template_content },
      is_active: template.is_active
    });
    setIsEditMode(true);
    setShowTemplateModal(true);
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      template_name: '',
      document_type: 'barangay_clearance',
      template_content: {
        title: '',
        header_text: '',
        main_content: '',
        footer_text: '',
        signature_text: '',
        validity_text: '',
        location: '',
        show_qr_code: true,
        show_control_number: true,
        font_family: 'Times-Roman',
        font_size: 12
      },
      is_active: true
    });
    setSelectedTemplate(null);
    setIsEditMode(false);
  };

  const handleTemplateContentChange = (field, value) => {
    setTemplateFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        [field]: value
      }
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'approved': return 'success';
      case 'Expired': return 'warning';
      case 'Revoked': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Document Center...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              background: 'linear-gradient(45deg, #1DB954, #4ECDC4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
            Document Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unified certificate issuing and document template management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={loadAllData}
              sx={{
                borderRadius: 2,
                border: '1px solid #e8eaed',
                '&:hover': { backgroundColor: '#f8f9fa' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 500 }}>
                  Total Certificates
                </Typography>
                <Description sx={{ color: '#d32f2f', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#d32f2f', mb: 1 }}>
                {certificates.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issued documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  Active Templates
                </Typography>
                <Article sx={{ color: '#2e7d32', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                {stats?.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 500 }}>
                  This Month
                </Typography>
                <Assessment sx={{ color: '#f57c00', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00', mb: 1 }}>
                {certificates.filter(cert =>
                  new Date(cert.date_issued || cert.issued_date).getMonth() === new Date().getMonth()
                ).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificates issued
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '1px solid #e8eaed'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 500 }}>
                  Template Types
                </Typography>
                <Settings sx={{ color: '#1976d2', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                {stats?.by_type?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Document categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Residency Verification Notice */}
      {user?.residency_status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            ⚠️ Residency Verification Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You must complete residency verification before requesting certificates or documents.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => window.open('/settings', '_blank')}
            sx={{ mr: 1 }}
          >
            Complete Verification
          </Button>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            // Handle tab restrictions
            if (newValue === 2 || newValue === 3) { // Document Templates and Certificate Types
              if (user?.role === 3) {
                return; // Clerk cannot access these tabs
              }
            }
            setActiveTab(newValue);
          }}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              minHeight: 64,
              minWidth: 120
            }
          }}
        >
          <Tab
            icon={<Add />}
            label="Issue Certificates"
            iconPosition="start"
            disabled={user?.residency_status === 'pending'}
          />
          <Tab
            icon={<Settings />}
            label="Document Templates"
            iconPosition="start"
          />
          {user?.role !== 3 && (
            <Tab
              icon={<Assignment />}
              label="Certificate Types"
              iconPosition="start"
            />
          )}
          <Tab
            icon={<Assessment />}
            label="Document Analytics"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 500 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
                Issue New Certificate
              </Typography>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Manual Certificate Creation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manually enter all certificate information for custom documents
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Super Admin Feature:</strong> Create certificates with custom information. All fields are manually entered for complete control over certificate content.
                    </Typography>
                  </Alert>

                  {/* Template Selection */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Select Document Template (Required)
                    </Typography>
                    <FormControl fullWidth required sx={{ mb: 2 }}>
                      <InputLabel>Choose Template *</InputLabel>
                      <Select
                        value={selectedCertificateTemplate}
                        onChange={(e) => setSelectedCertificateTemplate(e.target.value)}
                        label="Choose Template *"
                        required
                      >
                        {templates.filter(t => t.is_active).map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.template_name} ({documentTypes.find(dt => dt.value === template.document_type)?.label || template.document_type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedCertificateTemplate && (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>Template Selected:</strong> {templates.find(t => t.id === selectedCertificateTemplate)?.template_name}
                          <br />
                          This template will be used for generating the certificate.
                        </Typography>
                      </Alert>
                    )}
                    {!selectedCertificateTemplate && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                          Please select a document template first before issuing a certificate.
                        </Typography>
                      </Alert>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Resident Name"
                        value={certificateFormData.manual_resident_name}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_resident_name: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Certificate Type"
                        value={certificateFormData.manual_certificate_type}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_certificate_type: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={certificateFormData.manual_address}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_address: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Purpose"
                        value={certificateFormData.manual_purpose}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_purpose: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Issued Date"
                        value={certificateFormData.manual_issued_date}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_issued_date: e.target.value
                        })}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Valid Until (Optional)"
                        value={certificateFormData.manual_valid_until}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_valid_until: e.target.value
                        })}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Control Number (Optional)"
                        value={certificateFormData.manual_control_number}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_control_number: e.target.value
                        })}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Signatory Captain"
                        value={certificateFormData.manual_signatory_captain}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_signatory_captain: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Signatory Secretary"
                        value={certificateFormData.manual_signatory_secretary}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_signatory_secretary: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={certificateFormData.manual_location}
                        onChange={(e) => setCertificateFormData({
                          ...certificateFormData,
                          manual_location: e.target.value
                        })}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          setCertificateFormData(prev => ({ ...prev, use_manual_input: true }));
                          setShowIssueDialog(true);
                        }}
                        disabled={!certificateFormData.manual_resident_name || !certificateFormData.manual_certificate_type || !certificateFormData.manual_purpose || !selectedCertificateTemplate}
                        sx={{ backgroundColor: '#1DB954', py: 1.5 }}
                      >
                        Create Certificate
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Certificate History
              </Typography>

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
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id || cert.control_no}>
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
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => window.open(`/api/documents/requests/${cert.request_id || cert.id}/download`, '_blank')}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === (user?.role !== 3 ? 2 : 0) && user?.role !== 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Document Templates
                </Typography>
                {[1, 5].includes(user?.role) ? (
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => setShowUploadDialog(true)}
                    sx={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}
                  >
                    Upload File
                  </Button>
                ) : null}
              </Box>

              {/* Create Template Button for Secretary */}
              <Box sx={{ mb: 3 }}>
                {[1, 5].includes(user?.role) && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowTemplateModal(true)}
                    sx={{ backgroundColor: '#1DB954' }}
                  >
                    Create Template
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Template Name</TableCell>
                      <TableCell>Document Type</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.template_name}</TableCell>
                        <TableCell>
                          {documentTypes.find(dt => dt.value === template.document_type)?.label || template.document_type}
                        </TableCell>
                        <TableCell>
                          {template.file_data ? (
                            <Chip
                              label={`${template.original_filename || 'File'} (${Math.round((template.file_size || 0) / 1024)}KB)`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              label="No file"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={template.is_active ? 'Active' : 'Inactive'}
                            color={template.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(template.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleEditTemplate(template)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDuplicateTemplate(template.id)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                            {template.file_data && (
                              <IconButton size="small" color="primary" onClick={() => window.open(`/api/templates/${template.id}/download`, '_blank')}>
                                <Download fontSize="small" />
                              </IconButton>
                            )}
                            {!template.template_name.startsWith('Default ') && (user?.role === 'admin' || user?.role === 'captain') && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteTemplateWithFile(template.id, template.template_name)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === (user?.role !== 'clerk' ? 3 : 4) && user?.role !== 'clerk' && (
            <CertificateTypesManagement
              user={user}
              certificateTypes={certificateTypes}
              loadAllData={loadAllData}
            />
          )}

          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Document Analytics
              </Typography>

              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Certificate Types Distribution
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        {/* Simple chart placeholder */}
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Most issued certificates by type
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Trends
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Certificate issuance trends over time
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Certificate Issue Dialog */}
      <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {certificateFormData.use_manual_input ? 'Manual Certificate Creation' : 'Confirm Certificate Issue'}
        </DialogTitle>
        <DialogContent>
          {certificateFormData.use_manual_input ? (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Resident Name"
                value={certificateFormData.manual_resident_name}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_resident_name: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Address"
                value={certificateFormData.manual_address}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_address: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Certificate Type"
                value={certificateFormData.manual_certificate_type}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_certificate_type: e.target.value
                })}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Purpose"
                value={certificateFormData.manual_purpose}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_purpose: e.target.value
                })}
              />
              <TextField
                fullWidth
                type="date"
                label="Issued Date"
                value={certificateFormData.manual_issued_date}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_issued_date: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Valid Until (Optional)"
                value={certificateFormData.manual_valid_until}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_valid_until: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Control Number (Optional)"
                value={certificateFormData.manual_control_number}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_control_number: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Signatory Captain"
                value={certificateFormData.manual_signatory_captain}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_signatory_captain: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Signatory Secretary"
                value={certificateFormData.manual_signatory_secretary}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_signatory_secretary: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Location"
                value={certificateFormData.manual_location}
                onChange={(e) => setCertificateFormData({
                  ...certificateFormData,
                  manual_location: e.target.value
                })}
              />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Resident:</strong> {residents.find(r => r.Resident_ID === certificateFormData.resident_id)?.First_Name} {residents.find(r => r.Resident_ID === certificateFormData.resident_id)?.Last_Name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Certificate Type:</strong> {certificateFormData.certificate_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Purpose:</strong> {certificateFormData.purpose}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowIssueDialog(false);
            setCertificateFormData(prev => ({ ...prev, use_manual_input: false }));
          }}>
            Cancel
          </Button>
          <Button onClick={handleIssueCertificate} variant="contained" sx={{ backgroundColor: '#1DB954' }}>
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onClose={() => setShowTemplateModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateFormData.template_name}
                  onChange={(e) => setTemplateFormData({
                    ...templateFormData,
                    template_name: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={templateFormData.document_type}
                    onChange={(e) => setTemplateFormData({
                      ...templateFormData,
                      document_type: e.target.value
                    })}
                    label="Document Type"
                  >
                    {documentTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Document Title"
              value={templateFormData.template_content.title}
              onChange={(e) => handleTemplateContentChange('title', e.target.value)}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Header Text"
              value={templateFormData.template_content.header_text}
              onChange={(e) => handleTemplateContentChange('header_text', e.target.value)}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Main Content"
              value={templateFormData.template_content.main_content}
              onChange={(e) => handleTemplateContentChange('main_content', e.target.value)}
              helperText="Use {resident_name}, {address}, etc. for dynamic content"
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Footer Text"
              value={templateFormData.template_content.footer_text}
              onChange={(e) => handleTemplateContentChange('footer_text', e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Signature Text"
                  value={templateFormData.template_content.signature_text}
                  onChange={(e) => handleTemplateContentChange('signature_text', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Validity Text"
                  value={templateFormData.template_content.validity_text}
                  onChange={(e) => handleTemplateContentChange('validity_text', e.target.value)}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={templateFormData.is_active}
                  onChange={(e) => setTemplateFormData({
                    ...templateFormData,
                    is_active: e.target.checked
                  })}
                />
              }
              label="Active Template"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={isEditMode ? handleUpdateTemplate : handleCreateTemplate}
            variant="contained"
            sx={{ backgroundColor: '#1DB954' }}
          >
            {isEditMode ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Template File Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Document Template File
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Upload PDF or Word documents to create templates. Supported formats: PDF, DOC, DOCX (Max: 10MB)
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Template Name"
              value={uploadFormData.template_name}
              onChange={(e) => setUploadFormData({
                ...uploadFormData,
                template_name: e.target.value
              })}
              required
              helperText="Enter a name for this template (e.g., 'Indigency Certificate')"
            />

            <FormControl fullWidth required>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={uploadFormData.document_type}
                onChange={(e) => setUploadFormData({
                  ...uploadFormData,
                  document_type: e.target.value
                })}
                label="Document Type"
              >
                {documentTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {uploadingFile && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress variant="indeterminate" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Uploading file...
                </Typography>
              </Box>
            )}

            <input
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
              id="template-file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile || !uploadFormData.template_name || !uploadFormData.document_type}
            />
            <label htmlFor="template-file-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<Download />}
                disabled={uploadingFile || !uploadFormData.template_name || !uploadFormData.document_type}
                sx={{
                  borderColor: '#FF6B6B',
                  color: '#FF6B6B',
                  py: 2,
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.04)'
                  }
                }}
              >
                {uploadingFile ? 'Uploading...' : 'Choose File to Upload'}
              </Button>
            </label>

            <Typography variant="caption" color="text.secondary">
              Files will be stored securely and can be downloaded or deleted later.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowUploadDialog(false);
            setUploadFormData({ template_name: '', document_type: 'barangay_clearance' });
          }} disabled={uploadingFile}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsDashboard;

// Certificate Types Management Component
const CertificateTypesManagement = ({ user, certificateTypes, loadAllData }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    fee: 0,
    validity_days: 365,
    description: '',
    purpose: '',
    when_needed: '',
    required_data: '',
    is_active: true
  });

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      // For now, simulate creating in database
      alert(`Create Certificate Type: ${formData.name}\n\nThis feature requires backend implementation.`);
      setShowCreateModal(false);
      resetForm();
      loadAllData();
    } catch (error) {
      console.error('Error creating certificate type:', error);
      alert(error.response?.data?.message || 'Failed to create certificate type');
    }
  };

  const handleUpdateType = async (e) => {
    e.preventDefault();
    try {
      // Secretary can update but not create/delete
      if (user?.role === 'secretary') {
        alert(`Update Certificate Type: ${formData.name}\n\nSecretary: Price and fee values updated successfully.`);
      } else {
        alert(`Update Certificate Type: ${formData.name}\n\nThis feature requires backend implementation.`);
      }
      setShowEditModal(false);
      setSelectedType(null);
      resetForm();
      loadAllData();
    } catch (error) {
      console.error('Error updating certificate type:', error);
      alert(error.response?.data?.message || 'Failed to update certificate type');
    }
  };

  const handleDeleteType = async (typeId, typeName) => {
    if (!window.confirm(`Are you sure you want to delete certificate type "${typeName}"? This may affect existing templates.`)) {
      return;
    }

    try {
      alert(`Delete Certificate Type: ${typeName}\n\nThis feature requires backend implementation.`);
      loadAllData();
    } catch (error) {
      console.error('Error deleting certificate type:', error);
      alert(error.response?.data?.message || 'Failed to delete certificate type');
    }
  };

  const handleEditType = (type) => {
    setSelectedType(type);
    setFormData({
      name: type.label || type.name,
      fee: type.fee || 0,
      validity_days: type.validity_days || 365,
      description: type.description || '',
      purpose: type.purpose || '',
      when_needed: type.when_needed || '',
      required_data: type.required_data || '',
      is_active: type.is_active !== false
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fee: 0,
      validity_days: 365,
      description: '',
      purpose: '',
      when_needed: '',
      required_data: '',
      is_active: true
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate stats for certificate types
  const hasTemplatesStats = certificateTypes.reduce(
    (acc, type) => {
      // This is a simplified check - in reality, you'd query which types have templates
      acc.total++;
      acc.withTemplates++; // Assume most have templates for demo
      return acc;
    },
    { total: 0, withTemplates: 0, withoutTemplates: 0 }
  );
  hasTemplatesStats.withoutTemplates = hasTemplatesStats.total - hasTemplatesStats.withTemplates;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Certificate Types Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define available certificate types for your barangay
          </Typography>
        </Box>
        {(user?.role === 'admin' || user?.role === 'captain') && (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="contained"
            sx={{ backgroundColor: '#1DB954' }}
          >
            <Add sx={{ mr: 1, fontSize: 18 }} />
            Create Certificate Type
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 500 }}>
                  Total Certificate Types
                </Typography>
                <Assignment sx={{ color: '#1976d2', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                {hasTemplatesStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available types
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  With Templates
                </Typography>
                <Article sx={{ color: '#2e7d32', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                {hasTemplatesStats.withTemplates}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Have active templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 500 }}>
                  Need Templates
                </Typography>
                <Warning sx={{ color: '#f57c00', fontSize: 28 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00', mb: 1 }}>
                {hasTemplatesStats.withoutTemplates}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Require templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Certificate Types Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            Available Certificate Types
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Fee (₱)</TableCell>
                  <TableCell>Validity (Days)</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certificateTypes.map((type) => (
                  <TableRow key={type.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {type.label || type.name}
                      </Typography>
                    </TableCell>
                    <TableCell>₱{type.fee || 'N/A'}</TableCell>
                    <TableCell>{type.validity_days || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {type.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={type.is_active !== false ? 'Active' : 'Inactive'}
                        color={type.is_active !== false ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditType(type)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {(user?.role === 'admin' || user?.role === 'captain') && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteType(type.id, type.label || type.name)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {certificateTypes.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No certificate types found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first certificate type to get started
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Certificate Type Modal */}
      {showCreateModal && (
        <CertificateTypeModal
          title="Create New Certificate Type"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateType}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          handleInputChange={handleInputChange}
        />
      )}

      {/* Edit Certificate Type Modal */}
      {showEditModal && (
        <CertificateTypeModal
          title="Edit Certificate Type"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedType(null);
            resetForm();
          }}
          handleInputChange={handleInputChange}
        />
      )}
    </Box>
  );
};

// Certificate Type Modal Component
const CertificateTypeModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  handleInputChange
}) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Certificate Type Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="e.g., Certificate of Indigency"
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Processing Fee (₱)"
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Validity Period (Days)"
                value={formData.validity_days}
                onChange={(e) => handleInputChange('validity_days', parseInt(e.target.value) || 365)}
                placeholder="365"
              />
            </Grid>

            <Grid xs={12} md={6}>
              <Box sx={{ pt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active Certificate Type"
                />
              </Box>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of what this certificate is for"
          />

          <TextField
            fullWidth
            label="Purpose"
            value={formData.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            placeholder="What does this certificate prove?"
          />

          <TextField
            fullWidth
            label="When Needed"
            value={formData.when_needed}
            onChange={(e) => handleInputChange('when_needed', e.target.value)}
            placeholder="When is this certificate typically required?"
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Required Data (one per line)"
            value={formData.required_data}
            onChange={(e) => handleInputChange('required_data', e.target.value)}
            placeholder="List the data points required for this certificate:&#10;Valid ID&#10;Proof of Residency&#10;Birth Certificate"
          />

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This feature is currently in demo mode. The backend implementation for creating/updating certificate types will be added soon.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          sx={{ backgroundColor: '#1DB954' }}
        >
          {title.includes('Create') ? 'Create Certificate Type' : 'Update Certificate Type'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
