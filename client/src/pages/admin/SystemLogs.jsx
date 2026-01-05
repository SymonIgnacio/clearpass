import React, { useState, useEffect } from 'react';
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
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Security,
  Refresh,
  Download,
  FilterList,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SystemLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [filters, setFilters] = useState({
    event_type: '',
    user_role: '',
    result: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  const eventTypes = [
    'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'USER_CREATED', 'USER_UPDATED',
    'RESIDENT_REGISTERED', 'CERTIFICATE_REQUESTED', 'CERTIFICATE_ISSUED',
    'BLOTTER_CREATED', 'UNAUTHORIZED_ACCESS', 'ADMIN_ACTION'
  ];

  const userRoles = ['admin', 'captain', 'secretary', 'clerk', 'blotter_officer', 'resident'];

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/admin/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotalCount(data.total || 0);
      } else {
        setError(data.message || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      event_type: '',
      user_role: '',
      result: '',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPage(0);
  };

  const handleExportLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: 'csv',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/admin/logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getEventTypeIcon = (eventType) => {
    if (eventType.includes('FAILED') || eventType.includes('UNAUTHORIZED')) {
      return <Error color="error" />;
    }
    if (eventType.includes('WARNING') || eventType.includes('SUSPICIOUS')) {
      return <Warning color="warning" />;
    }
    if (eventType.includes('SUCCESS') || eventType.includes('CREATED')) {
      return <CheckCircle color="success" />;
    }
    return <Info color="info" />;
  };

  const getEventTypeColor = (eventType) => {
    if (eventType.includes('FAILED') || eventType.includes('UNAUTHORIZED')) {
      return 'error';
    }
    if (eventType.includes('WARNING') || eventType.includes('SUSPICIOUS')) {
      return 'warning';
    }
    if (eventType.includes('SUCCESS') || eventType.includes('CREATED')) {
      return 'success';
    }
    return 'info';
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              System Logs & Audit Trail
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor system activities and security events
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportLogs}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchLogs}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.event_type}
                  onChange={(e) => handleFilterChange('event_type', e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All Events</MenuItem>
                  {eventTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>User Role</InputLabel>
                <Select
                  value={filters.user_role}
                  onChange={(e) => handleFilterChange('user_role', e.target.value)}
                  label="User Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {userRoles.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Result</InputLabel>
                <Select
                  value={filters.result}
                  onChange={(e) => handleFilterChange('result', e.target.value)}
                  label="Result"
                >
                  <MenuItem value="">All Results</MenuItem>
                  <MenuItem value="SUCCESS">Success</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Date From"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Date To"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ height: '40px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(log.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getEventTypeIcon(log.event_type)}
                      <Chip
                        label={log.event_type}
                        color={getEventTypeColor(log.event_type)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.user_id || 'System'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.user_role || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.resource || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.result}
                      color={getResultColor(log.result)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.ip_address || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Entry Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Event Type
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.event_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatDate(selectedLog.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.user_id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Role
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.user_role || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.ip_address || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Result
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.result}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.resource || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {selectedLog.user_agent || 'N/A'}
                  </Typography>
                </Grid>
                {selectedLog.details && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Additional Details
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                        {typeof selectedLog.details === 'string' 
                          ? selectedLog.details 
                          : JSON.stringify(selectedLog.details, null, 2)
                        }
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemLogs;