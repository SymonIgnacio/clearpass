import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Tab,
  Tabs,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { apiRequest } from '../utils/api';
import ProtectedRoute from '../components/ProtectedRoute';
import { useParams } from 'react-router-dom';
import {
  Person,
  Phone,
  Description,
  CheckCircle,
  Cancel,
  Search,
  Schedule,
  NoteAdd,
  AttachFile,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Edit,
  FileUpload,
} from '@mui/icons-material';

const statusColors = {
  pending_review: 'warning',
  for_validation: 'info',
  awaiting_response: 'warning',
  ready_for_decision: 'primary',
  approved: 'success',
  rejected: 'error',
  under_appeal: 'secondary',
};

const investigationSteps = [
  { key: 'reviewed_complaint', label: 'Reviewed complaint details thoroughly', required: true },
  { key: 'contacted_complainant', label: 'Contacted complainant for verification', required: true },
  {
    key: 'attempted_contact_respondent',
    label: 'Attempted to contact respondent (if known)',
    required: false,
  },
  { key: 'reviewed_evidence', label: 'Reviewed submitted evidence', required: true },
  { key: 'conducted_investigation', label: 'Conducted investigation/interview', required: true },
  { key: 'documented_findings', label: 'Documented findings', required: true },
  { key: 'verified_location', label: 'Verified incident location', required: false },
  {
    key: 'confirmed_jurisdiction',
    label: 'Confirmed incident falls under barangay jurisdiction',
    required: true,
  },
];

const contactMethods = [
  { value: 'call', label: 'Phone Call' },
  { value: 'text', label: 'SMS/Text' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
  { value: 'video_call', label: 'Video Call' },
];

const rejectionReasons = [
  { value: 'insufficient_evidence', label: 'Insufficient Evidence' },
  { value: 'out_of_jurisdiction', label: 'Out of Barangay Jurisdiction' },
  { value: 'resolved_elsewhere', label: 'Already Resolved Elsewhere' },
  { value: 'false_report', label: 'False Report/Malicious' },
  { value: 'duplicate_report', label: 'Duplicate Report' },
  { value: 'no_legal_basis', label: 'No Legal Basis for Action' },
  { value: 'other', label: 'Other' },
];

const RequestDetail = () => {
  const { id: requestId } = useParams();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');

  const [investigationData, setInvestigationData] = useState({
    checklist: {},
    findings: '',
    contactLog: [],
  });

  const [newContact, setNewContact] = useState({
    method: '',
    date: '',
    notes: '',
    outcome: '',
  });

  const [infoRequestData, setInfoRequestData] = useState({
    message: '',
    required_fields: [],
  });

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [infoRequestDialogOpen, setInfoRequestDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState({ category: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiRequest(`/blotter-requests/${requestId}`, { method: 'GET' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.request?.investigation_checklist) {
          setInvestigationData(prev => ({
            ...prev,
            checklist: JSON.parse(json.data.request.investigation_checklist) || {},
          }));
        }
        if (json.data.request?.investigation_findings) {
          setInvestigationData(prev => ({
            ...prev,
            findings: json.data.request.investigation_findings,
          }));
        }
      } else {
        setMessage(json.message || 'Failed to load request details');
      }
    } catch (error) {
      setMessage('Failed to load request details');
      console.error('Error loading request:', error);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [requestId, load]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChecklistChange = key => event => {
    setInvestigationData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: event.target.checked,
      },
    }));
  };

  const saveInvestigation = async () => {
    setLoading(true);
    try {
      await apiRequest(`/blotter-requests/${requestId}/investigation`, {
        method: 'PATCH',
        body: {
          investigation_checklist: JSON.stringify(investigationData.checklist),
          investigation_findings: investigationData.findings,
        },
      });
      setMessage('Investigation progress saved');
      load();
    } catch (error) {
      setMessage('Failed to save investigation');
    } finally {
      setLoading(false);
    }
  };

  const submitContactLog = async () => {
    setLoading(true);
    try {
      await apiRequest(`/blotter-requests/${requestId}/contact-complainant`, {
        method: 'POST',
        body: newContact,
      });
      setMessage('Contact log added');
      setContactDialogOpen(false);
      setNewContact({ method: '', date: '', notes: '', outcome: '' });
      load();
    } catch (error) {
      setMessage('Failed to add contact log');
    } finally {
      setLoading(false);
    }
  };

  const submitInfoRequest = async () => {
    setLoading(true);
    try {
      await apiRequest(`/blotter-requests/${requestId}/request-info`, {
        method: 'POST',
        body: infoRequestData,
      });
      setMessage('Information request sent to resident');
      setInfoRequestDialogOpen(false);
      setInfoRequestData({ message: '', required_fields: [] });
      load();
    } catch (error) {
      setMessage('Failed to send information request');
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    setLoading(true);
    try {
      await apiRequest(`/blotter-requests/${requestId}/status`, {
        method: 'PATCH',
        body: { action: 'approve' },
      });
      setMessage('Request approved and converted to blotter case');
      load();
    } catch (error) {
      setMessage('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    setLoading(true);
    try {
      await apiRequest(`/blotter-requests/${requestId}/status`, {
        method: 'PATCH',
        body: {
          action: 'reject',
          reason: rejectReason.category,
          notes: rejectReason.notes,
        },
      });
      setMessage('Request rejected');
      setRejectDialogOpen(false);
      setRejectReason({ category: '', notes: '' });
      load();
    } catch (error) {
      setMessage('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const startValidation = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/blotter-requests/${requestId}/validate`, {
        method: 'PATCH',
        body: {
          assign_officer_id: null,
          due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
        },
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Validation started, due in 7 days');
        load();
      } else {
        setMessage(json.error?.message || 'Failed to start validation');
      }
    } catch (error) {
      setMessage('Failed to start validation');
    } finally {
      setLoading(false);
    }
  };

  const isInvestigationComplete = () => {
    const required = investigationSteps.filter(s => s.required);
    return required.every(step => investigationData.checklist[step.key] === true);
  };

  const canApprove = () => {
    return true;
  };

  if (!data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>Loading...</Box>;
  }

  const { request, audits } = data;

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Request Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Request ID
                  </Typography>
                  <Typography>#{request.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Status
                  </Typography>
                  <Chip
                    label={request.status}
                    color={statusColors[request.status] || 'default'}
                    size='small'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Incident Type
                  </Typography>
                  <Typography>{request.incident_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Location
                  </Typography>
                  <Typography>
                    {request.location_sitio}{' '}
                    {request.location_details && `- ${request.location_details}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Incident Date
                  </Typography>
                  <Typography>{new Date(request.incident_datetime).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Submitted
                  </Typography>
                  <Typography>{new Date(request.created_at).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Complainant Information
              </Typography>
              <Typography>
                <strong>Name:</strong> {request.complainant_name || 'N/A'}
              </Typography>
              <Typography>
                <strong>Contact Method:</strong>{' '}
                {request.complainant_contact_method || 'Not specified'}
              </Typography>
              <Typography>
                <strong>Address:</strong> {request.complainant_address || 'N/A'}
              </Typography>
              <Typography>
                <strong>ID Type:</strong> {request.complainant_id_type || 'N/A'}
              </Typography>
              <Typography>
                <strong>ID Number:</strong> {request.complainant_id_number || 'Not provided'}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Respondent Information
              </Typography>
              <Typography>
                <strong>Name:</strong> {request.respondent_name || 'Not specified'}
              </Typography>
              <Typography>
                <strong>Alias:</strong> {request.respondent_alias || 'N/A'}
              </Typography>
              <Typography>
                <strong>Address:</strong> {request.respondent_address || 'N/A'}
              </Typography>
              <Typography>
                <strong>Contact:</strong> {request.respondent_contact || 'N/A'}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Description
              </Typography>
              <Typography variant='body1'>{request.description_text}</Typography>
            </Paper>

            {request.attachments_json && JSON.parse(request.attachments_json).length > 0 && (
              <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Evidence Files
                </Typography>
                {JSON.parse(request.attachments_json).map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mb: 1,
                      p: 1,
                      border: '1px solid #eee',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFile fontSize='small' />
                      <Typography>{file.filename}</Typography>
                      <Chip
                        size='small'
                        label={`${(file.size / 1024).toFixed(0)} KB`}
                        variant='outlined'
                      />
                    </Box>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<Visibility />}
                      onClick={() =>
                        window.open(
                          `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/uploads/${file.filename}`,
                          '_blank'
                        )
                      }
                    >
                      View
                    </Button>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='h6'>Request Additional Information</Typography>
                <Button
                  variant='outlined'
                  startIcon={<NoteAdd />}
                  onClick={() => setInfoRequestDialogOpen(true)}
                >
                  Request Info
                </Button>
              </Box>

              {audits?.filter(a => a.action === 'requested_info').length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Previous Information Requests</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {audits
                      .filter(a => a.action === 'requested_info')
                      .map(audit => (
                        <Paper key={audit.id} sx={{ p: 2, mb: 1 }}>
                          <Typography variant='body2'>{audit.message_text}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {new Date(audit.created_at).toLocaleString()}
                          </Typography>
                        </Paper>
                      ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Make Decision
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant='contained'
                  color='success'
                  size='large'
                  startIcon={<CheckCircle />}
                  onClick={approve}
                  disabled={
                    !canApprove() || loading || ['approved', 'rejected'].includes(request.status)
                  }
                >
                  {loading ? 'Processing...' : 'Approve Request'}
                </Button>

                <Typography align='center'>or</Typography>

                <Button
                  variant='contained'
                  color='error'
                  size='large'
                  startIcon={<Cancel />}
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={loading || ['approved', 'rejected'].includes(request.status)}
                >
                  Reject Request
                </Button>
              </Stack>
            </Paper>

            {request.approved_blotter_case_number && (
              <Paper sx={{ p: 3, bgcolor: 'success.light' }}>
                <Typography variant='h6' gutterBottom>
                  Approved
                </Typography>
                <Typography>
                  This request has been converted to blotter case:{' '}
                  <strong>{request.approved_blotter_case_number}</strong>
                </Typography>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4'>Request #{requestId}</Typography>
        <Chip
          label={request.status}
          color={statusColors[request.status] || 'default'}
          size='large'
        />
      </Box>

      {message && (
        <Alert severity='info' sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {request.status === 'pending_review' && (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={startValidation}>
              Start Validation
            </Button>
          }
        >
          This request is pending review. Start validation to begin investigation.
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor='primary'
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
        >
          <Tab label='Request Review' icon={<Visibility />} />
          <Tab label='Contact Complainant' icon={<Phone />} />
          <Tab label='Decision' icon={<CheckCircle />} />
        </Tabs>
      </Paper>

      {renderTabContent()}

      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Log Contact with Complainant</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Contact Method</InputLabel>
            <Select
              value={newContact.method}
              onChange={e => setNewContact(prev => ({ ...prev, method: e.target.value }))}
              label='Contact Method'
            >
              {contactMethods.map(method => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type='datetime-local'
            label='Date & Time'
            value={newContact.date}
            onChange={e => setNewContact(prev => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Notes'
            value={newContact.notes}
            onChange={e => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label='Outcome'
            value={newContact.outcome}
            onChange={e => setNewContact(prev => ({ ...prev, outcome: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitContactLog} variant='contained'>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={infoRequestDialogOpen}
        onClose={() => setInfoRequestDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Request Information from Resident</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            This will notify the resident that additional information is required.
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Message to Resident'
            value={infoRequestData.message}
            onChange={e => setInfoRequestData(prev => ({ ...prev, message: e.target.value }))}
            placeholder='Specify what information is needed...'
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoRequestDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitInfoRequest} variant='contained'>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Rejection Reason</InputLabel>
            <Select
              value={rejectReason.category}
              onChange={e => setRejectReason(prev => ({ ...prev, category: e.target.value }))}
              label='Rejection Reason'
            >
              {rejectionReasons.map(reason => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Additional Notes'
            value={rejectReason.notes}
            onChange={e => setRejectReason(prev => ({ ...prev, notes: e.target.value }))}
            placeholder='Provide additional context for rejection...'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={reject} variant='contained' color='error'>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestDetail;
