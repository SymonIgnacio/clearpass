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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  TablePagination
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
  Settings,
  Article,
  Download,
  Assignment,
  PendingActions,
  CheckCircle,
  Cancel,
  Visibility
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';
import { ROLES } from '../utils/roles';
import { useAuth } from '../contexts/useAuth';
import ConfirmationModal from '../components/ConfirmationModal';
import RejectionModal from '../components/RejectionModal';
import TemplateUploadWizard from '../components/TemplateUploadWizard';
import SmartResidentSearch from '../components/SmartResidentSearch';

// Color palette for charts
const COLORS = ['#1DB954', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

const DocumentsDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Snackbar State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

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

  // Dynamic fields for manual certificate
  const [dynamicFields, setDynamicFields] = useState({});
  const [extractedPlaceholders, setExtractedPlaceholders] = useState([]);

  // Helper to extract placeholders from template content
  const extractPlaceholders = (template) => {
    if (!template) return [];

    // Filter out standard system variables
    const standardVars = [
      'resident_name', 'address', 'purpose', 'issued_date', 'valid_until', 
      'control_number', 'signatory_captain', 'signatory_secretary', 'location',
      'day', 'month', 'year', 'date_issued', 'issued_on', 'control_no',
      'captain_name', 'secretary_name', 'barangay_name', 'municipality_name', 
      'province_name', 'first_name', 'last_name', 'middle_name', 'age', 
      'civil_status', 'gender', 'place_of_birth', 'date_of_birth',
      'residency_years', 'or_no', 'prepared_by', 'issued_at',
      'ctc_no' // Added ctc_no to standard variables as it is auto-generated
    ];

    // PRIORITY 1: Check required_fields from database (for seeded/uploaded templates)
    if (template.required_fields) {
      try {
        const fields = typeof template.required_fields === 'string' 
          ? JSON.parse(template.required_fields) 
          : template.required_fields;
        
        if (Array.isArray(fields) && fields.length > 0) {
          // STRICT FILTER: Remove standard vars from required_fields too
          return fields.map(f => f.key).filter(v => !standardVars.includes(v));
        }
      } catch (e) {
        console.error('Error parsing required_fields:', e);
      }
    }
    
    // PRIORITY 2: Fallback to scanning template_content (for manually created text templates)
    if (template.template_content) {
      const content = template.template_content;
      const textToScan = [
        content.main_content,
        content.header_text,
        content.footer_text,
        content.signature_text,
        content.validity_text
      ].join(' ');

      const regex = /{([a-zA-Z0-9_]+)}/g;
      const matches = [...textToScan.matchAll(regex)].map(m => m[1]);

      const uniqueMatches = [...new Set(matches)].filter(v => !standardVars.includes(v));
      return uniqueMatches;
    }

    return [];
  };

  useEffect(() => {
    if (selectedCertificateTemplate) {
      const template = templates.find(t => t.id === selectedCertificateTemplate);
      if (template) {
        const placeholders = extractPlaceholders(template);
        
        // Only update if placeholders have changed to avoid resetting user input
        if (JSON.stringify(placeholders) !== JSON.stringify(extractedPlaceholders)) {
          setExtractedPlaceholders(placeholders);
          
          // Initialize dynamic fields
          const initialFields = {};
          placeholders.forEach(field => {
            initialFields[field] = '';
          });
          setDynamicFields(initialFields);
        }
      }
    } else {
      setExtractedPlaceholders([]);
      setDynamicFields({});
    }
  }, [selectedCertificateTemplate, templates, extractedPlaceholders]);

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  
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

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

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
      // Fetch templates/types for ALL staff (Admin, Captain, Secretary, Clerk) as they are needed for issuing/viewing
      const hasManagementAccess = [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK].includes(user?.role);
      
      // Only fetch template stats for Admin/Captain/Secretary
      const shouldFetchStats = [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY].includes(user?.role);

      // Load all data in parallel
      const [
        certificatesRes,
        templatesRes,
        certTypesRes,
        requestsRes,
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
        hasManagementAccess
          ? apiRequest('certificate-requests/admin/all?limit=100').catch((err) => {
              console.error('Requests API failed:', err);
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
              return { data: null };
            })
          : Promise.resolve({ data: null })
      ]);

      const certData = certificatesRes.json
        ? await certificatesRes.json().catch((err) => {
            console.error('Failed to parse certificates JSON:', err);
            return [];
          })
        : certificatesRes;
      
      const safeCertificates = Array.isArray(certData) ? certData : (certData.data || []);
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
      const requestsResponse = requestsRes.json
        ? await requestsRes.json().catch((err) => {
            console.error('Failed to parse requests JSON:', err);
            return { data: [] };
          })
        : requestsRes;
      const requestsData = requestsResponse.data || [];
      const residentsData = residentsRes.json
        ? await residentsRes.json().catch((err) => {
            console.error('Failed to parse residents JSON:', err);
            return { data: [] };
          })
        : residentsRes;
      
      const statsData = shouldFetchStats && statsRes && statsRes.ok ?
        await statsRes.json().catch((err) => {
          console.error('Failed to parse stats JSON:', err);
          return null;
        }) : null;

      const safeTemplates = Array.isArray(templateData.data) ? templateData.data : (Array.isArray(templateData) ? templateData : []);
      
      setCertificates(safeCertificates);
      setTemplates(safeTemplates);
      setCertificateTypes(certTypesData || []);
      setRequests(requestsData || []);
      setResidents(residentsData.data || []);
      setStats(statsData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      let formData;
      // Get the correct template name even if state is slightly out of sync
      const currentTemplate = templates.find(t => t.id === selectedCertificateTemplate);
      const manualType = certificateFormData.manual_certificate_type || (currentTemplate ? currentTemplate.template_name : '');

      if (certificateFormData.use_manual_input) {
        // Manual input mode - send custom certificate data
        formData = {
          resident_id: certificateFormData.resident_id, // Ensure resident_id is sent
          manual_certificate: true,
          resident_name: certificateFormData.manual_resident_name,
          address: certificateFormData.manual_address,
          purpose: certificateFormData.manual_purpose,
          certificate_type: manualType,
          issued_date: certificateFormData.manual_issued_date,
          valid_until: certificateFormData.manual_valid_until,
          control_number: certificateFormData.manual_control_number,
          signatory_captain: certificateFormData.manual_signatory_captain,
          signatory_secretary: certificateFormData.manual_signatory_secretary,
          manual_location: certificateFormData.manual_location,
          dynamic_data: {
            ...dynamicFields,
            // Inject auto-generated values for standard manual issuance fields
            ctc_no: `CTC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            or_no: `OR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            prepared_by: user?.name || 'Clerk'
          }
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
      showSnackbar('Certificate issued successfully!', 'success');
      setShowIssueDialog(false);
      resetCertificateForm();
      loadAllData();

      // Auto-download PDF
      setTimeout(() => {
           if (data.request_id) {
             // New robust download via request ID
             window.open(`${window.location.origin}/api/documents/requests/${data.request_id}/download`, '_blank');
           } else {
             // Fallback for manual (legacy or if ID missing)
             window.open(`${window.location.origin}/api/documents/download?type=${encodeURIComponent(formData.certificate_type)}&manual=true&controlNo=${data.control_no}`, '_blank');
           }
      }, 500);

    } else {
      showSnackbar(`Error: ${data.error || 'Failed to issue certificate'}`, 'error');
    }
  } catch (error) {
      console.error('Error issuing certificate:', error);
      showSnackbar('Network error occurred', 'error');
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
    setDynamicFields({});
  };

  // --- TEMPLATE MANAGEMENT ACTIONS (ADMIN ONLY) ---
  const handleCreateTemplate = async () => {
    if (user?.role !== ROLES.ADMIN) return;
    try {
      const response = await apiRequest('templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateFormData)
      });

      if (response.ok) {
        showSnackbar('Template created successfully!', 'success');
        setShowTemplateModal(false);
        resetTemplateForm();
        loadAllData();
      } else {
        const error = await response.json();
        showSnackbar(`Error: ${error.message || 'Failed to create template'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      showSnackbar('Network error occurred', 'error');
    }
  };

  const handleUpdateTemplate = async () => {
    if (user?.role !== ROLES.ADMIN) return;
    try {
      const response = await apiRequest(`templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateFormData)
      });

      if (response.ok) {
        showSnackbar('Template updated successfully!', 'success');
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        resetTemplateForm();
        loadAllData();
      } else {
        const error = await response.json();
        showSnackbar(`Error: ${error.message || 'Failed to update template'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      showSnackbar('Network error occurred', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (user?.role !== ROLES.ADMIN) return;
    setConfirmationAction({
      type: 'delete_template',
      id: templateId,
      title: 'Delete Template',
      message: `Are you sure you want to delete "${templateName}"?`,
      icon: 'warning'
    })
    setConfirmationModalOpen(true)
  }

  const handleDeleteTemplateConfirm = async () => {
    try {
      const response = await apiRequest(`templates/${confirmationAction.id}`, { method: 'DELETE' });

      if (response.ok) {
        showSnackbar('Template deleted successfully!', 'success');
        loadAllData();
      } else {
        showSnackbar('Failed to delete template', 'error');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showSnackbar('Network error occurred', 'error');
    }
  }

  const handleDuplicateTemplate = async (templateId) => {
    if (user?.role !== ROLES.ADMIN) return;
    setConfirmationAction({
      type: 'duplicate_template',
      id: templateId,
      title: 'Duplicate Template',
      message: 'Enter name for the new template:',
      icon: 'info',
      showInput: true,
      inputLabel: 'New Template Name'
    })
    setConfirmationModalOpen(true)
  }

  const handleDuplicateTemplateConfirm = async (inputValue) => {
    if (!inputValue) return;

    try {
      const response = await apiRequest(`templates/${confirmationAction.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_template_name: inputValue })
      });

      if (response.ok) {
        showSnackbar('Template duplicated successfully!', 'success');
        loadAllData();
      } else {
        showSnackbar('Failed to duplicate template', 'error');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      showSnackbar('Network error occurred', 'error');
    }
  }

  const handleDeleteTemplateWithFile = async (templateId, templateName) => {
    if (user?.role !== ROLES.ADMIN) return;
    setConfirmationAction({
      type: 'delete_template_file',
      id: templateId,
      title: 'Delete Template & File',
      message: `Are you sure you want to delete "${templateName}" and its associated file? This action cannot be undone.`,
      icon: 'warning'
    })
    setConfirmationModalOpen(true)
  }

  const handleDeleteTemplateWithFileConfirm = async () => {
    try {
      const response = await apiRequest(`templates/${confirmationAction.id}/with-file`, { method: 'DELETE' });

      if (response.ok) {
        showSnackbar('Template and file deleted successfully!', 'success');
        loadAllData();
      } else {
        showSnackbar('Failed to delete template and file', 'error');
      }
    } catch (error) {
      console.error('Error deleting template with file:', error);
      showSnackbar('Network error occurred', 'error');
    }
  }

  const handleConfirmationConfirm = async (inputValue) => {
    setConfirmationModalOpen(false)
    
    if (confirmationAction.type === 'delete_template') {
      await handleDeleteTemplateConfirm()
    } else if (confirmationAction.type === 'duplicate_template') {
      await handleDuplicateTemplateConfirm(inputValue)
    } else if (confirmationAction.type === 'delete_template_file') {
      await handleDeleteTemplateWithFileConfirm()
    }

    setConfirmationAction(null)
  }

  const handleFileUpload = async (event) => {
    if (user?.role !== ROLES.ADMIN) return;
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('template_file', file);
    formData.append('template_name', uploadFormData.template_name || file.name.replace(/\.[^/.]+$/, ""));
    formData.append('document_type', uploadFormData.document_type);

    setUploadingFile(true);
    try {
      const response = await apiRequest('/templates/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showSnackbar('Template file uploaded successfully!', 'success');
        setShowUploadDialog(false);
        setUploadFormData({ template_name: '', document_type: 'barangay_clearance' });
        loadAllData();
      } else {
        const error = await response.json();
        showSnackbar(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showSnackbar('Network error occurred during upload', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditTemplate = (template) => {
    if (user?.role !== ROLES.ADMIN) return;
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

  // Determine Tab Visibility
  const canIssue = [ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK].includes(Number(user?.role));
  const canViewTemplates = [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY].includes(Number(user?.role));
  const canViewTypes = [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY].includes(Number(user?.role));
  const canViewAnalytics = [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY].includes(Number(user?.role));
  const canManage = Number(user?.role) === ROLES.ADMIN; // STRICTLY ADMIN ONLY
  const canProcessRequests = [ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK].includes(Number(user?.role));

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

      {/* Stats Overview - Only for Admin/Captain/Secretary */}
      {canViewAnalytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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

          <Grid item xs={12} sm={6} md={3}>
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

          <Grid item xs={12} sm={6} md={3}>
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

          <Grid item xs={12} sm={6} md={3}>
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
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
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
          {canIssue && (
            <Tab
              icon={<Add />}
              label="Issue Certificates"
              iconPosition="start"
              disabled={user?.residency_status === 'pending'}
            />
          )}

          {canProcessRequests && (
             <Tab
               icon={<PendingActions />}
               label="Certificate Requests"
               iconPosition="start"
             />
          )}
          
          {/* Certificate History - Visible to All Staff */}
          <Tab
            icon={<Description />}
            label="Certificate History"
            iconPosition="start"
          />
          
          {canViewTemplates && (
            <Tab
              icon={<Settings />}
              label="Document Templates"
              iconPosition="start"
            />
          )}
          
          {canViewTypes && (
            <Tab
              icon={<Assignment />}
              label="Certificate Types"
              iconPosition="start"
            />
          )}
          
          {canViewAnalytics && (
            <Tab
              icon={<Assessment />}
              label="Document Analytics"
              iconPosition="start"
            />
          )}
        </Tabs>

        <Box sx={{ p: 3, minHeight: 500 }}>
          {/* LOGIC TO RENDER CORRECT TAB CONTENT BASED ON INDEX AND VISIBILITY */}
          {(() => {
            // Map tab index to content
            // We need to calculate the index dynamically based on visibility
            const tabs = [];
            if (canIssue) tabs.push('issue');
            if (canProcessRequests) tabs.push('requests');
            tabs.push('history'); // Always present
            if (canViewTemplates) tabs.push('templates');
            if (canViewTypes) tabs.push('types');
            if (canViewAnalytics) tabs.push('analytics');

            const currentTabName = tabs[activeTab];

            switch (currentTabName) {
              case 'issue':
                return (
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
                              onChange={(e) => {
                                const templateId = e.target.value;
                                setSelectedCertificateTemplate(templateId);
                                const template = templates.find(t => t.id === templateId);
                                if (template) {
                                  setCertificateFormData(prev => ({
                                    ...prev,
                                    manual_certificate_type: template.template_name
                                  }));
                                }
                              }}
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
                          <Grid item xs={12} md={6}>
                            <SmartResidentSearch
                              label="Resident Name (Search)"
                              required
                              value={null}
                              onChange={(resident) => {
                                if (resident) {
                                  // Auto-fill form data from selected resident
                                  const fullName = `${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name}`.trim();
                                  const address = resident.sitio_name 
                                    ? `${resident.sitio_name}, Barangay Batia` 
                                    : 'Barangay Batia, Bocaue, Bulacan';
                                    
                                  setCertificateFormData(prev => ({
                                    ...prev,
                                    manual_resident_name: fullName,
                                    manual_address: address,
                                    resident_id: resident.Resident_ID
                                  }));
                                } else {
                                  // Clear if selection cleared
                                  setCertificateFormData(prev => ({
                                    ...prev,
                                    manual_resident_name: '',
                                    manual_address: '',
                                    resident_id: ''
                                  }));
                                }
                              }}
                            />
                            {/* Hidden manual input for compatibility/fallback display */}
                            <TextField
                              fullWidth
                              sx={{ mt: 1, display: certificateFormData.manual_resident_name ? 'block' : 'none' }}
                              label="Selected Resident Name"
                              value={certificateFormData.manual_resident_name}
                              onChange={(e) => setCertificateFormData({
                                ...certificateFormData,
                                manual_resident_name: e.target.value
                              })}
                              required
                              helperText="You can manually edit this if needed"
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

                          <Grid item xs={12} md={6}>
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

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              type="date"
                              label="Valid Until (Optional)"
                              value={certificateFormData.manual_valid_until}
                              onChange={(e) => setCertificateFormData({
                                ...certificateFormData,
                                manual_valid_until: e.target.value
                              })}
                              InputLabelProps={{ shrink: true }}
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

                          {/* Dynamic Fields */}
                          {extractedPlaceholders.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" sx={{ mb: 2, mt: 1, color: 'primary.main' }}>
                                Additional Template Information
                              </Typography>
                              <Grid container spacing={2}>
                                {extractedPlaceholders.map((field) => (
                                  <Grid item xs={12} md={6} key={field}>
                                    <TextField
                                      fullWidth
                                      label={field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                      value={dynamicFields[field] || ''}
                                      onChange={(e) => setDynamicFields(prev => ({
                                        ...prev,
                                        [field]: e.target.value
                                      }))}
                                      required
                                      helperText={`Value for {${field}}`}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Grid>
                          )}

                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => {
                                setCertificateFormData(prev => ({ ...prev, use_manual_input: true }));
                                setShowIssueDialog(true);
                              }}
                              disabled={
                                !certificateFormData.manual_resident_name || 
                                // Check if template is selected (type is derived from it)
                                (!certificateFormData.manual_certificate_type && !selectedCertificateTemplate) || 
                                !certificateFormData.manual_purpose || 
                                !selectedCertificateTemplate ||
                                // Check if all required dynamic fields are filled
                                extractedPlaceholders.some(field => !dynamicFields[field])
                              }
                              sx={{ backgroundColor: '#1DB954', py: 1.5 }}
                            >
                              Create Certificate
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                );

              case 'requests':
                return (
                  <CertificateRequestsManagement
                    user={user}
                    requests={requests}
                    loadAllData={loadAllData}
                    canManage={canManage}
                    showSnackbar={showSnackbar}
                  />
                );

              case 'history':
                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                      <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Certificate History
                    </Typography>

                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 900 }}>
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
                          {certificates
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((cert) => (
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
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={certificates.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </Box>
                );

              case 'templates':
                return (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Document Templates
                      </Typography>
                      {canManage && (
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => setShowUploadDialog(true)}
                          sx={{ borderColor: '#FF6B6B', color: '#FF6B6B' }}
                        >
                          Upload File
                        </Button>
                      )}
                    </Box>

                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Template Name</TableCell>
                            <TableCell>Document Type</TableCell>
                            <TableCell>File</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Updated</TableCell>
                            {canManage && <TableCell>Actions</TableCell>}
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
                              {canManage && (
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
                                    {!template.template_name.startsWith('Default ') && (
                                      <IconButton size="small" color="error" onClick={() => handleDeleteTemplateWithFile(template.id, template.template_name)}>
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );

              case 'types':
                return (
                  <CertificateTypesManagement
                    user={user}
                    certificateTypes={certificateTypes}
                    loadAllData={loadAllData}
                    canManage={canManage}
                    showSnackbar={showSnackbar}
                  />
                );

              case 'analytics':
                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                      <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Document Analytics
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
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
                );

              default:
                return null;
            }
          })()}
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

      {/* Template Upload Wizard */}
      <TemplateUploadWizard 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)} 
        onSuccess={() => {
          loadAllData();
          showSnackbar('Template created successfully!', 'success');
        }}
      />

      <ConfirmationModal
        open={confirmationModalOpen}
        onClose={() => {
          setConfirmationModalOpen(false);
          setConfirmationAction(null);
        }}
        onConfirm={handleConfirmationConfirm}
        title={confirmationAction?.title}
        message={confirmationAction?.message}
        type={confirmationAction?.icon || 'info'}
        showInput={confirmationAction?.showInput}
        inputLabel={confirmationAction?.inputLabel}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentsDashboard;

// Certificate Types Management Component
const CertificateTypesManagement = ({ user, certificateTypes, loadAllData, canManage, showSnackbar }) => {
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

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      // Convert required_data string to array
      const payload = {
        ...formData,
        required_data: formData.required_data 
          ? formData.required_data.split('\n').map(item => item.trim()).filter(item => item)
          : []
      };

      const response = await apiRequest('certificate-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showSnackbar(`Certificate Type created successfully`, 'success');
        setShowCreateModal(false);
        resetForm();
        loadAllData();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Failed to create certificate type', 'error');
      }
    } catch (error) {
      console.error('Error creating certificate type:', error);
      showSnackbar(error.response?.data?.message || 'Failed to create certificate type', 'error');
    }
  };

  const handleUpdateType = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      // Convert required_data string to array
      const payload = {
        ...formData,
        required_data: formData.required_data 
          ? formData.required_data.split('\n').map(item => item.trim()).filter(item => item)
          : []
      };

      const response = await apiRequest(`certificate-types/${selectedType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showSnackbar(`Certificate Type updated successfully`, 'success');
        setShowEditModal(false);
        setSelectedType(null);
        resetForm();
        loadAllData();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Failed to update certificate type', 'error');
      }
    } catch (error) {
      console.error('Error updating certificate type:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update certificate type', 'error');
    }
  };

  const handleDeleteType = async (typeId, typeName) => {
    if (!canManage) return;
    setConfirmationAction({
      type: 'delete_cert_type',
      id: typeId,
      name: typeName,
      title: 'Delete Certificate Type',
      message: `Are you sure you want to delete certificate type "${typeName}"? This may affect existing templates.`,
      icon: 'warning'
    })
    setConfirmationModalOpen(true)
  }
  
  const handleDeleteTypeConfirm = async () => {
    try {
      const response = await apiRequest(`certificate-types/${confirmationAction.id}`, { method: 'DELETE' });
      
      if (response.ok) {
        showSnackbar(`Certificate Type deleted successfully`, 'success');
        loadAllData();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Failed to delete certificate type', 'error');
      }
    } catch (error) {
      console.error('Error deleting certificate type:', error);
      showSnackbar(error.response?.data?.message || 'Failed to delete certificate type', 'error');
    }
  }

  const handleConfirmationConfirm = async () => {
    setConfirmationModalOpen(false)
    if (confirmationAction.type === 'delete_cert_type') {
      await handleDeleteTypeConfirm()
    }
    setConfirmationAction(null)
  }

  const handleEditType = (type) => {
    if (!canManage) return;
    
    let parsedRequiredData = '';
    try {
      if (type.required_data) {
        if (Array.isArray(type.required_data)) {
          parsedRequiredData = type.required_data.join('\n');
        } else if (typeof type.required_data === 'string') {
          // Check if it's a JSON string
          if (type.required_data.trim().startsWith('[')) {
            parsedRequiredData = JSON.parse(type.required_data).join('\n');
          } else {
            parsedRequiredData = type.required_data;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing required_data:', e);
      parsedRequiredData = type.required_data || '';
    }

    setSelectedType(type);
    setFormData({
      name: type.label || type.name,
      fee: type.fee || 0,
      validity_days: type.validity_days || 365,
      description: type.description || '',
      purpose: type.purpose || '',
      when_needed: type.when_needed || '',
      required_data: parsedRequiredData,
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
        {canManage && (
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
        <Grid item xs={12} sm={6} md={4}>
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

        <Grid item xs={12} sm={6} md={4}>
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

        <Grid item xs={12} sm={6} md={4}>
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

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
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
                      {canManage && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditType(type)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteType(type.id, type.label || type.name)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      {!canManage && (
                        <Chip label="Read Only" size="small" variant="outlined" />
                      )}
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

      <ConfirmationModal
        open={confirmationModalOpen}
        onClose={() => {
          setConfirmationModalOpen(false);
          setConfirmationAction(null);
        }}
        onConfirm={handleConfirmationConfirm}
        title={confirmationAction?.title}
        message={confirmationAction?.message}
        type={confirmationAction?.icon || 'info'}
      />
    </Box>
  );
};

// Certificate Requests Management Component
const CertificateRequestsManagement = ({ user, requests, loadAllData, canManage, showSnackbar, fetchRequests }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [frontIdUrl, setFrontIdUrl] = useState(null);
  const [backIdUrl, setBackIdUrl] = useState(null);
  const [loadingIds, setLoadingIds] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Editable state
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionAction, setRejectionAction] = useState(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  // Reload data when filter changes
  useEffect(() => {
    if (fetchRequests) {
        fetchRequests(statusFilter);
    }
  }, [statusFilter]);

  const handleTabChange = (event, newValue) => {
    setStatusFilter(newValue);
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    // Initialize editable data from request_data
    setEditableData(request.request_data || {});
    setIsEditing(false);

    setViewDialogOpen(true);
    setLoadingIds(true);
    setFrontIdUrl(null);
    setBackIdUrl(null);

    try {
      // Load ID images
      const [frontRes, backRes] = await Promise.all([
        apiRequest(`certificate-requests/${request.request_id}/attachment/front`, { responseType: 'blob' }),
        apiRequest(`certificate-requests/${request.request_id}/attachment/back`, { responseType: 'blob' })
      ]);

      if (frontRes.ok) {
        const blob = await frontRes.blob();
        setFrontIdUrl(URL.createObjectURL(blob));
      }
      if (backRes.ok) {
        const blob = await backRes.blob();
        setBackIdUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error('Error loading IDs:', error);
      showSnackbar('Failed to load ID attachments', 'error');
    } finally {
      setLoadingIds(false);
    }
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedRequest(null);
    setEditableData({});
    setIsEditing(false);
    if (frontIdUrl) URL.revokeObjectURL(frontIdUrl);
    if (backIdUrl) URL.revokeObjectURL(backIdUrl);
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;
    setSavingChanges(true);
    try {
        const response = await apiRequest(`certificate-requests/${selectedRequest.request_id}/details`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_data: editableData })
        });

        if (response.ok) {
            showSnackbar('Request details updated successfully', 'success');
            setIsEditing(false);
            // Update local state to reflect changes without full reload
            const updatedRequest = { ...selectedRequest, request_data: editableData };
            setSelectedRequest(updatedRequest);
            // Also trigger parent reload to keep table in sync
            loadAllData();
        } else {
            const data = await response.json();
            showSnackbar(data.message || 'Failed to update details', 'error');
        }
    } catch (error) {
        console.error('Error updating details:', error);
        showSnackbar('Network error while saving changes', 'error');
    } finally {
        setSavingChanges(false);
    }
  };

  const handleReject = (id) => {
    // If id is provided, it's from the table action
    const requestId = id || selectedRequest?.request_id;
    if (!requestId) return;
    
    setRejectionAction({ id: requestId })
    setRejectionModalOpen(true)
  }

  const handleRejectionConfirm = async (reason) => {
    setRejectionModalOpen(false)
    try {
      await apiRequest(`certificate-requests/${rejectionAction.id}/reject`, {
        method: 'POST',
        body: { remarks: reason }
      })
      showSnackbar('Request rejected successfully', 'success')
      if (viewDialogOpen) handleCloseDialog()
      loadAllData()
    } catch (error) {
      console.error('Error rejecting request:', error)
      showSnackbar('Error rejecting request', 'error')
    }
    setRejectionAction(null)
  }
  
  const handleApprove = (id) => {
     // If id is provided, it's from the table action
     const requestId = id || selectedRequest?.request_id;
     if (!requestId) return;

     setConfirmationAction({
       type: 'approve_request',
       id: requestId,
       title: 'Approve Request',
       message: 'Are you sure you want to approve this certificate request?',
       icon: 'success'
     })
     setConfirmationModalOpen(true)
  }

  const handleConfirmationConfirm = async () => {
    setConfirmationModalOpen(false)
    if (confirmationAction.type === 'approve_request') {
      await handleUpdateStatus('approved')
    }
    setConfirmationAction(null)
  }

  const handleUpdateStatus = async (status, remarks = '') => {
    const requestId = confirmationAction?.id || selectedRequest?.request_id;
    if (!requestId) return;
    
    try {
      const response = await apiRequest(`certificate-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks })
      });

      if (response.ok) {
        showSnackbar(`Request ${status} successfully`, 'success');
        
        // Auto-download PDF if approved
        if (status === 'approved') {
            const request = requests.find(r => r.request_id === requestId) || selectedRequest;
            if (request) {
                // Wait briefly for the server to process, then trigger download
                setTimeout(() => {
                    window.open(`${window.location.origin}/api/documents/download?type=${encodeURIComponent(request.document_type)}&requestId=${requestId}`, '_blank');
                }, 500);
            }
        }

        if (viewDialogOpen) handleCloseDialog();
        loadAllData();
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Network error', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
        <PendingActions sx={{ mr: 1, verticalAlign: 'middle' }} />
        Certificate Requests
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Resident</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.request_id}</TableCell>
                <TableCell>{req.resident_name}</TableCell>
                <TableCell>{req.document_type}</TableCell>
                <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={req.status} 
                    color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewRequest(req)} color="primary">
                    <Visibility />
                  </IconButton>
                  {req.status === 'pending' && canManage && (
                    <>
                      <IconButton onClick={() => handleApprove(req.request_id)} color="success">
                        <CheckCircle />
                      </IconButton>
                      <IconButton onClick={() => handleReject(req.request_id)} color="error">
                        <Cancel />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No pending requests</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={viewDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Resident</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRequest.resident_name}</Typography>
                  
                  <Typography variant="subtitle2">Type</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRequest.document_type}</Typography>

                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <Typography variant="subtitle2">Request Details</Typography>
                     {canManage && selectedRequest.status === 'pending' && !isEditing && (
                        <Button size="small" startIcon={<Edit />} onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                     )}
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {isEditing ? (
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Object.entries(editableData).map(([key, value]) => {
                           // Skip internal keys if any, though usually we want all inputs
                           if (key === 'is_manual' || key === 'control_no') return null;
                           return (
                             <TextField
                                key={key}
                                label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                value={value}
                                onChange={(e) => setEditableData(prev => ({ ...prev, [key]: e.target.value }))}
                                fullWidth
                                size="small"
                                multiline={key === 'purpose'}
                             />
                           );
                        })}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                           <Button size="small" onClick={() => {
                               setIsEditing(false);
                               setEditableData(selectedRequest.request_data || {});
                           }}>Cancel</Button>
                           <Button 
                              size="small" 
                              variant="contained" 
                              onClick={handleSaveChanges}
                              disabled={savingChanges}
                           >
                               {savingChanges ? 'Saving...' : 'Save Changes'}
                           </Button>
                        </Box>
                     </Box>
                  ) : (
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(selectedRequest.request_data || {}).map(([key, value]) => {
                           if (key === 'is_manual' || key === 'control_no') return null;
                           return (
                             <Box key={key}>
                               <Typography variant="caption" color="text.secondary">
                                 {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                               </Typography>
                               <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                 {typeof value === 'object' ? JSON.stringify(value) : value}
                               </Typography>
                             </Box>
                           );
                        })}
                     </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">ID Attachments</Typography>
                  {loadingIds ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      {frontIdUrl && (
                        <Box>
                          <Typography variant="caption">Front</Typography>
                          <img src={frontIdUrl} alt="Front ID" style={{ width: '100%', maxHeight: 150, objectFit: 'contain' }} />
                        </Box>
                      )}
                      {backIdUrl && (
                        <Box>
                          <Typography variant="caption">Back</Typography>
                          <img src={backIdUrl} alt="Back ID" style={{ width: '100%', maxHeight: 150, objectFit: 'contain' }} />
                        </Box>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button 
                color="error" 
                startIcon={<Cancel />}
                onClick={() => handleReject()}
              >
                Reject
              </Button>
              <Button 
                color="success" 
                variant="contained" 
                startIcon={<CheckCircle />}
                onClick={() => handleApprove()}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <RejectionModal
        open={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleRejectionConfirm}
        title="Reject Request"
        message="Please provide a reason for rejecting this request:"
        inputLabel="Rejection Remarks"
      />

      <ConfirmationModal
        open={confirmationModalOpen}
        onClose={() => {
          if (!confirmationAction?.type || confirmationAction.type === 'info' || confirmationAction.type === 'error') {
            setConfirmationModalOpen(false)
            setConfirmationAction(null)
          } else {
            setConfirmationModalOpen(false)
          }
        }}
        onConfirm={handleConfirmationConfirm}
        title={confirmationAction?.title}
        message={confirmationAction?.message}
        type={confirmationAction?.icon || 'info'}
      />
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Certificate Type Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="e.g., Certificate of Indigency"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Validity Period (Days)"
                value={formData.validity_days}
                onChange={(e) => handleInputChange('validity_days', parseInt(e.target.value) || 365)}
                placeholder="365"
              />
            </Grid>

            <Grid item xs={12} md={6}>
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
              <strong>Note:</strong> Required data items will be displayed to residents when requesting this certificate.
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
