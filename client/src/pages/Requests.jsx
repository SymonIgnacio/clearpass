import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Grid,
  Checkbox,
  Toolbar,
  Paper,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { apiRequest } from '../utils/api';
import ProtectedRoute from '../components/ProtectedRoute';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
  FilterList,
  ArrowDownward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending_review: 'warning',
  for_validation: 'info',
  awaiting_response: 'warning',
  ready_for_decision: 'primary',
  approved: 'success',
  rejected: 'error',
  under_appeal: 'secondary',
};

const statusLabels = {
  pending_review: 'Pending Review',
  for_validation: 'Under Validation',
  awaiting_response: 'Awaiting Response',
  ready_for_decision: 'Ready for Decision',
  approved: 'Approved',
  rejected: 'Rejected',
  under_appeal: 'Under Appeal',
};

const getStatusPriority = status => {
  const priorities = {
    under_appeal: 1,
    awaiting_response: 2,
    for_validation: 3,
    ready_for_decision: 4,
    pending_review: 5,
    approved: 6,
    rejected: 7,
  };
  return priorities[status] || 99;
};

const Requests = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkInfoDialogOpen, setBulkInfoDialogOpen] = useState(false);
  const [bulkAssignOfficer, setBulkAssignOfficer] = useState('');
  const [bulkInfoMessage, setBulkInfoMessage] = useState('');
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [activeAppealRequest, setActiveAppealRequest] = useState(null);
  const [appealAction, setAppealAction] = useState('');
  const [appealMessage, setAppealMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [validatingId, setValidatingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const res = await apiRequest('/users?role=admin,blotter_officer', { method: 'GET' });
        const data = await res.json();
        if (data.success && data.data) {
          setOfficers(data.data);
        }
      } catch (error) {
        console.error('Failed to load officers:', error);
        // Fallback to hardcoded list if API fails
        setOfficers([
          { id: 1, name: 'Admin' },
          { id: 6, name: 'Blotter Officer' },
        ]);
      }
    };
    loadOfficers();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/blotter-requests', {
        method: 'GET',
        params: {
          status: statusFilter || undefined,
          page: pagination.page,
          limit: pagination.limit,
        },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || data.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    load();
  }, [statusFilter, pagination.page, load]);

  useEffect(() => {
    let filtered = [...items];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r =>
          (r.id && r.id.toString().includes(term)) ||
          (r.incident_type && r.incident_type.toLowerCase().includes(term)) ||
          (r.complainant_name && r.complainant_name.toLowerCase().includes(term)) ||
          (r.location_sitio && r.location_sitio.toLowerCase().includes(term)) ||
          (r.description_text && r.description_text.toLowerCase().includes(term))
      );
    }

    if (officerFilter) {
      filtered = filtered.filter(
        r =>
          r.validation_assigned_officer_id &&
          r.validation_assigned_officer_id.toString() === officerFilter
      );
    }

    if (overdueOnly) {
      const now = new Date();
      filtered = filtered.filter(
        r =>
          r.validation_due_at &&
          new Date(r.validation_due_at) < now &&
          ['for_validation', 'awaiting_response'].includes(r.status)
      );
    }

    filtered.sort((a, b) => {
      const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, officerFilter, overdueOnly]);

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedRequests(new Set(filteredItems.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectOne = id => event => {
    const newSelected = new Set(selectedRequests);
    if (event.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRequests(newSelected);
  };

  const isSelected = id => selectedRequests.has(id);

  const handleBulkAssign = async () => {
    if (selectedRequests.size === 0) return;
    if (!bulkAssignOfficer) {
      showNotification('Please select an officer', 'warning');
      return;
    }
    try {
      await apiRequest('/blotter-requests/bulk-assign', {
        method: 'POST',
        body: {
          request_ids: Array.from(selectedRequests),
          officer_id: parseInt(bulkAssignOfficer),
        },
      });
      setBulkAssignDialogOpen(false);
      setBulkAssignOfficer('');
      setSelectedRequests(new Set());
      load();
      showNotification(`Assigned ${selectedRequests.size} request(s) to officer`, 'success');
    } catch (error) {
      console.error('Failed to bulk assign:', error);
      showNotification('Failed to assign requests', 'error');
    }
  };

  const handleBulkRequestInfo = async () => {
    if (selectedRequests.size === 0) return;
    try {
      await apiRequest('/blotter-requests/bulk-request-info', {
        method: 'POST',
        body: {
          request_ids: Array.from(selectedRequests),
          message: bulkInfoMessage,
        },
      });
      setBulkInfoDialogOpen(false);
      setBulkInfoMessage('');
      setSelectedRequests(new Set());
      showNotification('Information requested from affected residents', 'success');
    } catch (error) {
      console.error('Failed to bulk request info:', error);
      showNotification('Failed to request information', 'error');
    }
  };

  const handleAppeal = async action => {
    if (!activeAppealRequest) return;
    try {
      await apiRequest(`/blotter-requests/${activeAppealRequest.id}/handle-appeal`, {
        method: 'PATCH',
        body: {
          action,
          message: appealMessage,
        },
      });
      setAppealDialogOpen(false);
      setAppealAction('');
      setAppealMessage('');
      setActiveAppealRequest(null);
      load();
      showNotification(`Appeal ${action === 'approve_appeal' ? 'approved' : 'denied'}`, 'success');
    } catch (error) {
      console.error('Failed to handle appeal:', error);
      showNotification('Failed to process appeal', 'error');
    }
  };

  const startValidation = async id => {
    setValidatingId(id);
    try {
      await apiRequest(`/blotter-requests/${id}/validate`, {
        method: 'PATCH',
        body: { note: 'Assigned for validation' },
      });
      showNotification('Validation started successfully', 'success');
      load();
    } catch (error) {
      console.error('Failed to start validation:', error);
      showNotification('Failed to start validation', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const approve = async id => {
    setApprovingId(id);
    try {
      const res = await apiRequest(`/blotter-requests/${id}/status`, {
        method: 'PATCH',
        body: { action: 'approve' },
      });
      if (res.ok) {
        showNotification('Request approved successfully', 'success');
        load();
        setTimeout(() => navigate('/blotter'), 1500);
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to approve', 'error');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      showNotification('Failed to approve request', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const reject = id => {
    setActiveId(id);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!activeId) return;
    setRejectingId(activeId);
    try {
      const res = await apiRequest(`/blotter-requests/${activeId}/status`, {
        method: 'PATCH',
        body: { action: 'reject', reason: rejectReason || 'Rejected' },
      });
      setRejectOpen(false);
      setRejectReason('');
      setActiveId(null);
      if (res.ok) {
        showNotification('Request rejected successfully', 'success');
        load();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to reject', 'error');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      showNotification('Failed to reject request', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const isOverdue = request => {
    if (!request.validation_due_at) return false;
    const dueDate = new Date(request.validation_due_at);
    return dueDate < new Date() && ['for_validation', 'awaiting_response'].includes(request.status);
  };

  const needsAttention = request => {
    return (
      isOverdue(request) ||
      request.status === 'awaiting_response' ||
      request.status === 'ready_for_decision'
    );
  };

  const canApproveRequest = request => {
    // Only allow approval if investigation is complete
    if (request.status !== 'ready_for_decision') return false;
    
    if (!request.investigation_checklist) return false;
    
    const checklist = typeof request.investigation_checklist === 'string' 
      ? JSON.parse(request.investigation_checklist) 
      : request.investigation_checklist;
    
    // Required investigation steps
    const requiredSteps = [
      'reviewed_complaint',
      'contacted_complainant', 
      'reviewed_evidence',
      'conducted_investigation',
      'documented_findings',
      'confirmed_jurisdiction'
    ];
    
    // Check all required steps are completed
    const allRequiredCompleted = requiredSteps.every(step => checklist[step] === true);
    
    // Check findings are documented
    const hasFindings = request.investigation_findings && 
                       request.investigation_findings.trim().length > 0;
    
    return allRequiredCompleted && hasFindings;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setOfficerFilter('');
    setOverdueOnly(false);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h4'>
            Blotter Requests
          </Typography>
          <Stack direction='row' spacing={1}>
            <Button startIcon={<Refresh />} onClick={load} disabled={loading}>
              Refresh
            </Button>
            {selectedRequests.size > 0 && (
              <>
                <Button variant='outlined' onClick={() => setBulkAssignDialogOpen(true)}>
                  Assign ({selectedRequests.size})
                </Button>
                <Button variant='outlined' onClick={() => setBulkInfoDialogOpen(true)}>
                  Request Info ({selectedRequests.size})
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant='subtitle1'>Filters</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label='Search'
                  placeholder='ID, incident, complainant...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  size='small'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    label='Status'
                  >
                    <MenuItem value=''>All</MenuItem>
                    <MenuItem value='approved'>Approved</MenuItem>
                    <MenuItem value='rejected'>Rejected</MenuItem>
                    <MenuItem value='for_validation'>Under Validation</MenuItem>
                    <MenuItem value='pending_review'>Pending Review</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Assigned Officer</InputLabel>
                  <Select
                    value={officerFilter}
                    onChange={e => setOfficerFilter(e.target.value)}
                    label='Assigned Officer'
                  >
                    <MenuItem value=''>All</MenuItem>
                    {officers.map(o => (
                      <MenuItem key={o.id} value={o.id.toString()}>
                        {o.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Stack direction='row' spacing={1}>
                  <Button
                    variant={overdueOnly ? 'contained' : 'outlined'}
                    size='small'
                    onClick={() => setOverdueOnly(!overdueOnly)}
                    color='error'
                  >
                    Overdue Only
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={clearFilters}
                    disabled={!searchTerm && !statusFilter && !officerFilter && !overdueOnly}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
              Showing {filteredItems.length} of {items.length} requests
            </Typography>
          </CardContent>
        </Card>

        {needsAttention(filteredItems.filter(r => needsAttention(r)).length > 0) && (
          <Alert severity='warning' sx={{ mb: 3 }}>
            {filteredItems.filter(r => needsAttention(r)).length} request(s) need your attention
            (overdue or awaiting response)
          </Alert>
        )}

        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={
                        filteredItems.length > 0 && selectedRequests.size === filteredItems.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ID
                      <IconButton
                        size='small'
                        onClick={() =>
                          setFilteredItems(prev => [...prev].sort((a, b) => a.id - b.id))
                        }
                      >
                        <ArrowDownward fontSize='small' />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>Incident</TableCell>
                  <TableCell>Complainant</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align='center'>
                      <Typography color='text.secondary' sx={{ py: 3 }}>
                        {loading ? 'Loading...' : 'No blotter requests found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(r => (
                    <TableRow
                      key={r.id}
                      hover
                      sx={{
                        backgroundColor: isOverdue(r)
                          ? 'error.light'
                          : needsAttention(r)
                            ? 'warning.light'
                            : 'inherit',
                      }}
                    >
                      <TableCell padding='checkbox'>
                        <Checkbox checked={isSelected(r.id)} onChange={handleSelectOne(r.id)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontFamily='monospace'>
                          #{r.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {r.incident_type ||
                            (r.description_text ? `${r.description_text.slice(0, 30)}…` : '—')}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.complainant_name || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[r.status] || r.status}
                          color={statusColors[r.status] || 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{r.location_sitio || '—'}</TableCell>
                      <TableCell>
                        <Typography variant='caption'>
                          {new Date(r.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color={isOverdue(r) ? 'error' : 'inherit'}>
                          {r.validation_due_at
                            ? new Date(r.validation_due_at).toLocaleDateString()
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction='row' spacing={0.5}>
                          <Tooltip title='View Details'>
                            <IconButton
                              size='small'
                              onClick={() => navigate(`/officer/request/${r.id}`)}
                            >
                              <Visibility fontSize='small' />
                            </IconButton>
                          </Tooltip>

                          {r.status === 'pending_review' && (
                            <Tooltip title='Start Validation'>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => startValidation(r.id)}
                                disabled={validatingId === r.id}
                              >
                                {validatingId === r.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Schedule fontSize='small' />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}

                          {canApproveRequest(r) && (
                            <Tooltip title='Approve Request'>
                              <IconButton
                                size='small'
                                color='success'
                                onClick={() => approve(r.id)}
                                disabled={approvingId === r.id}
                              >
                                {approvingId === r.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CheckCircle fontSize='small' />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}

                          {r.status !== 'rejected' && r.status !== 'approved' && (
                            <Tooltip title='Reject Request'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => reject(r.id)}
                                disabled={rejectingId === r.id}
                              >
                                {rejectingId === r.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Cancel fontSize='small' />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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
      </Box>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Reject Request #{activeId}</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This will mark the request as rejected. The resident can still provide additional
            context or appeal.
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Rejection Reason</InputLabel>
            <Select
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              label='Rejection Reason'
            >
              <MenuItem value=''>Select reason...</MenuItem>
              <MenuItem value='insufficient_evidence'>Insufficient Evidence</MenuItem>
              <MenuItem value='out_of_jurisdiction'>Out of Barangay Jurisdiction</MenuItem>
              <MenuItem value='resolved_elsewhere'>Already Resolved Elsewhere</MenuItem>
              <MenuItem value='false_report'>False Report/Malicious</MenuItem>
              <MenuItem value='duplicate_report'>Duplicate Report</MenuItem>
              <MenuItem value='no_legal_basis'>No Legal Basis for Action</MenuItem>
              <MenuItem value='other'>Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button onClick={confirmReject} variant='contained' color='error'>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkAssignDialogOpen}
        onClose={() => setBulkAssignDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Bulk Assign Requests</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Assigning {selectedRequests.size} request(s) for validation
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Assign to Officer</InputLabel>
            <Select
              value={bulkAssignOfficer}
              onChange={e => setBulkAssignOfficer(e.target.value)}
              label='Assign to Officer'
            >
              {officers.map(o => (
                <MenuItem key={o.id} value={o.id.toString()}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkAssign} variant='contained' disabled={!bulkAssignOfficer}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkInfoDialogOpen}
        onClose={() => setBulkInfoDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Request Additional Information</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Requesting information from {selectedRequests.size} affected resident(s)
          </Alert>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Message to Residents'
            value={bulkInfoMessage}
            onChange={e => setBulkInfoMessage(e.target.value)}
            placeholder='Specify what additional information is needed...'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkInfoDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkRequestInfo} variant='contained' disabled={!bulkInfoMessage}>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={appealDialogOpen}
        onClose={() => setAppealDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Process Appeal #{activeAppealRequest?.id}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Resident submitted an appeal for this rejected request.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={appealAction}
              onChange={e => setAppealAction(e.target.value)}
              label='Action'
            >
              <MenuItem value='approve_appeal'>Approve Appeal (Re-open for Validation)</MenuItem>
              <MenuItem value='deny_appeal'>Deny Appeal</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Response Message'
            value={appealMessage}
            onChange={e => setAppealMessage(e.target.value)}
            placeholder='Explain your decision...'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppealDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleAppeal(appealAction)}
            variant='contained'
            disabled={!appealAction}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Requests;
