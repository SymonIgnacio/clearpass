import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  IconButton,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { apiRequest } from '../utils/api';
import {
  CheckCircle,
  Schedule,
  Person,
  Description,
  Message,
  AttachFile,
  ArrowForward,
  ExpandMore,
  Warning,
  Cancel,
  Info,
  Refresh,
} from '@mui/icons-material';

const ComplaintHistory = () => {
  const [complaints, setComplaints] = useState([]);
  const [complaintAudits, setComplaintAudits] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondNote, setRespondNote] = useState('');
  const [respondFile, setRespondFile] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealRequestId, setAppealRequestId] = useState(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [appealFile, setAppealFile] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/blotter-requests/my', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      const data = await response.json();

      if (data.success) {
        setComplaints(data.data);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));

        const auditData = {};
        await Promise.all(
          data.data.map(async complaint => {
            try {
              const auditRes = await apiRequest(`/blotter-requests/${complaint.id}`, {
                params: { include_audits: true },
              });
              const auditJson = await auditRes.json();
              if (auditJson.success && auditJson.data) {
                auditData[complaint.id] = auditJson.data.audits || [];
              }
            } catch (error) {
              console.error(`Failed to fetch audits for request ${complaint.id}:`, error);
            }
          })
        );
        setComplaintAudits(auditData);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load complaints' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchComplaints();
  }, [pagination.page, fetchComplaints]);

  const openRespond = id => {
    setActiveRequestId(id);
    setRespondOpen(true);
  };

  const closeRespond = () => {
    setRespondOpen(false);
    setRespondNote('');
    setRespondFile(null);
    setActiveRequestId(null);
  };

  const submitRespond = async () => {
    if (!activeRequestId) return;
    try {
      const fd = new FormData();
      if (respondNote) fd.append('message', respondNote);
      if (respondFile) fd.append('images', respondFile);
      const res = await apiRequest(`/blotter-requests/${activeRequestId}/respond-info`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Response submitted' });
        closeRespond();
        fetchComplaints();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Failed to submit response' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit response' });
    }
  };

  const openAppeal = id => {
    setAppealRequestId(id);
    setAppealMessage('');
    setAppealFile(null);
    setAppealOpen(true);
  };

  const submitAppeal = async () => {
    if (!appealRequestId) return;
    try {
      const fd = new FormData();
      if (appealMessage) fd.append('message', appealMessage);
      if (appealFile) fd.append('files', appealFile);
      const res = await apiRequest(`/blotter-requests/${appealRequestId}/appeal`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Appeal submitted successfully' });
        setAppealOpen(false);
        setAppealMessage('');
        setAppealFile(null);
        fetchComplaints();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Failed to submit appeal' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit appeal' });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending_review':
        return 'warning';
      case 'for_validation':
        return 'info';
      case 'awaiting_response':
        return 'warning';
      case 'ready_for_decision':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'under_appeal':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'pending_review':
        return 'Pending Review';
      case 'for_validation':
        return 'Under Validation';
      case 'awaiting_response':
        return 'Awaiting Your Response';
      case 'ready_for_decision':
        return 'Investigation Complete';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_appeal':
        return 'Under Appeal';
      default:
        return status;
    }
  };

  const getStatusNextStep = status => {
    switch (status) {
      case 'pending_review':
        return 'Awaiting officer assignment for validation';
      case 'for_validation':
        return 'Officer is investigating. Be available for contact.';
      case 'awaiting_response':
        return 'Please respond to information request from officer';
      case 'ready_for_decision':
        return 'Officer completed investigation. Awaiting decision.';
      case 'approved':
        return 'Request approved. Case number assigned.';
      case 'rejected':
        return 'Request rejected. You may add context or appeal.';
      case 'under_appeal':
        return 'Your appeal is under review.';
      default:
        return '';
    }
  };

  const getActionIcon = action => {
    switch (action) {
      case 'submitted':
        return <Person />;
      case 'assigned_validation':
        return <CheckCircle />;
      case 'added_note':
        return <Description />;
      case 'requested_info':
        return <Message />;
      case 'resident_response':
        return <Message />;
      case 'approved':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      case 'contacted_complainant':
        return <Person />;
      case 'investigation_complete':
        return <CheckCircle />;
      case 'appealed':
        return <Refresh />;
      default:
        return <Info />;
    }
  };

  const getActionColor = action => {
    switch (action) {
      case 'submitted':
        return 'info';
      case 'assigned_validation':
        return 'primary';
      case 'added_note':
        return 'default';
      case 'requested_info':
        return 'warning';
      case 'resident_response':
        return 'success';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'contacted_complainant':
        return 'info';
      case 'investigation_complete':
        return 'primary';
      case 'appealed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatActionLabel = action => {
    switch (action) {
      case 'submitted':
        return 'Request Submitted';
      case 'assigned_validation':
        return 'Assigned for Validation';
      case 'added_note':
        return 'Investigation Note Added';
      case 'requested_info':
        return 'Information Requested';
      case 'resident_response':
        return 'You Responded';
      case 'approved':
        return 'Request Approved';
      case 'rejected':
        return 'Request Rejected';
      case 'appeal_approved':
        return 'Appeal Approved';
      case 'appeal_denied':
        return 'Appeal Denied';
      case 'contacted_complainant':
        return 'Officer Contacted You';
      case 'investigation_complete':
        return 'Investigation Completed';
      case 'appealed':
        return 'Appeal Submitted';
      default:
        return action;
    }
  };

  const toggleRow = id => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderTimeline = audits => {
    if (!audits || audits.length === 0) {
      return (
        <Typography color='text.secondary' variant='body2'>
          No activity recorded yet.
        </Typography>
      );
    }

    return (
      <List>
        {audits.map(audit => (
          <ListItem key={audit.id} alignItems='flex-start'>
            <ListItemIcon>
              <Box sx={{ color: getActionColor(audit.action) }}>{getActionIcon(audit.action)}</Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Paper sx={{ p: 2, mb: 1 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                    {formatActionLabel(audit.action)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {new Date(audit.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                  {audit.message_text && (
                    <Typography variant='body2' sx={{ mt: 1 }}>
                      {audit.message_text}
                    </Typography>
                  )}
                  {audit.attachments_json && JSON.parse(audit.attachments_json).length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachFile fontSize='small' color='action' />
                      <Typography variant='caption'>
                        {JSON.parse(audit.attachments_json).length} file(s) attached
                      </Typography>
                    </Box>
                  )}
                </Paper>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      <Typography variant='h4' gutterBottom>
        My Blotter Requests
      </Typography>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Incident Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Incident Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Approved Case</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      <Typography color='text.secondary'>No complaints found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map(req => (
                    <React.Fragment key={req.id}>
                      <TableRow hover>
                        <TableCell>
                          <Typography variant='body2' fontFamily='monospace'>
                            #{req.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {req.incident_type ||
                              (req.description_text
                                ? `${req.description_text.slice(0, 40)}…`
                                : '—')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={getStatusLabel(req.status)}
                              color={getStatusColor(req.status)}
                              size='small'
                            />
                            <Typography variant='caption' color='text.secondary'>
                              {getStatusNextStep(req.status)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(req.incident_datetime)}</TableCell>
                        <TableCell>{req.location_sitio}</TableCell>
                        <TableCell>
                          <Badge
                            color='success'
                            variant={req.approved_blotter_case_number ? 'dot' : 'standard'}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            {req.approved_blotter_case_number || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {(req.status === 'awaiting_response' ||
                              req.status === 'for_validation') && (
                                <Button
                                  size='small'
                                  variant='outlined'
                                  onClick={() => openRespond(req.id)}
                                  startIcon={<Message />}
                                >
                                  Respond
                                </Button>
                              )}
                            {req.status === 'rejected' && (
                              <Button
                                size='small'
                                variant='outlined'
                                color='warning'
                                onClick={() => openAppeal(req.id)}
                                startIcon={<Refresh />}
                              >
                                Appeal
                              </Button>
                            )}
                            <Button
                              size='small'
                              variant='outlined'
                              onClick={() => toggleRow(req.id)}
                              endIcon={
                                expandedRows[req.id] ? (
                                  <ExpandMore sx={{ transform: 'rotate(180deg)' }} />
                                ) : (
                                  <ExpandMore />
                                )
                              }
                            >
                              {expandedRows[req.id] ? 'Hide' : 'View Details'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {expandedRows[req.id] && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ p: 0, borderBottom: 'none' }}>
                            <Paper sx={{ p: 3, m: 2, bgcolor: 'background.default' }}>
                              <Typography variant='h6' gutterBottom>
                                Request Details
                              </Typography>

                              <Box sx={{ mb: 2 }}>
                                <Typography variant='subtitle2' color='primary'>
                                  Description
                                </Typography>
                                <Typography variant='body2'>{req.description_text}</Typography>
                              </Box>

                              <Box sx={{ mb: 2 }}>
                                <Typography variant='subtitle2' color='primary'>
                                  Incident Location
                                </Typography>
                                <Typography variant='body2'>
                                  {req.location_sitio}
                                  {req.location_details && ` - ${req.location_details}`}
                                </Typography>
                              </Box>

                              <Divider sx={{ my: 2 }} />
                              <Typography variant='h6' gutterBottom>
                                Activity Timeline
                              </Typography>
                              {renderTimeline(complaintAudits[req.id])}
                            </Paper>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {Math.ceil(pagination.total / pagination.limit) > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={pagination.page}
                onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                color='primary'
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={respondOpen} onClose={closeRespond} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Message color='primary' />
            Respond to Information Request
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Officer has requested additional information. Please provide as much detail as possible.
          </Alert>
          <TextField
            label='Message'
            fullWidth
            multiline
            minRows={4}
            value={respondNote}
            onChange={e => setRespondNote(e.target.value)}
            placeholder='Provide the requested information...'
            sx={{ mb: 2 }}
          />
          <Button component='label' variant='outlined' startIcon={<AttachFile />} fullWidth>
            Upload Evidence (Optional)
            <input
              type='file'
              accept='image/*,.pdf,.doc,.docx'
              hidden
              onChange={e => setRespondFile(e.target.files?.[0] || null)}
            />
          </Button>
          {respondFile && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Selected: {respondFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRespond}>Cancel</Button>
          <Button
            onClick={submitRespond}
            variant='contained'
            disabled={!respondNote && !respondFile}
          >
            Submit Response
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={appealOpen} onClose={() => setAppealOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Submit Appeal for Request #{appealRequestId}</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Appeal will be reviewed by officers. You can provide additional context or evidence to
            support your appeal.
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Appeal Message'
            value={appealMessage}
            onChange={e => setAppealMessage(e.target.value)}
            placeholder='Explain why you believe this request should be reconsidered...'
            sx={{ mb: 2 }}
          />
          <Button component='label' variant='outlined' startIcon={<AttachFile />} fullWidth>
            Upload Additional Evidence (Optional)
            <input
              type='file'
              accept='image/*,.pdf,.doc,.docx'
              hidden
              onChange={e => setAppealFile(e.target.files?.[0] || null)}
            />
          </Button>
          {appealFile && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Selected: {appealFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppealOpen(false)}>Cancel</Button>
          <Button
            onClick={submitAppeal}
            variant='contained'
            disabled={!appealMessage && !appealFile}
          >
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplaintHistory;
