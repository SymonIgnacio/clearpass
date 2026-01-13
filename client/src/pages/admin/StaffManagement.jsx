import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Checkbox,
  FormGroup,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import Person from '@mui/icons-material/Person';
import Block from '@mui/icons-material/Block';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Security from '@mui/icons-material/Security';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import VpnKey from '@mui/icons-material/VpnKey';
import Info from '@mui/icons-material/Info';
import ContactMail from '@mui/icons-material/ContactMail';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ConfirmationModal from '../../components/ConfirmationModal';
import { apiRequest } from '../../utils/api';

const PERMISSION_MODULES = [
  { id: 'residents', label: 'Residents Management' },
  { id: 'certificates', label: 'Certificate Issuance' },
  { id: 'blotter', label: 'Blotter Records' },
  { id: 'users', label: 'User Management' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'system', label: 'System Configuration' }
];

const PERMISSION_ACTIONS = [
  { id: 'read', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'update', label: 'Edit' },
  { id: 'delete', label: 'Delete' }
];

const StaffManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  // Staff State
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    is_active: true,
    password: ''
  });

  // Role State
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    role_name: '',
    description: '',
    hierarchy_level: 1,
    permissions: {}
  });

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('admin/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      setError('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log('StaffManagement: fetchRoles started');
      const response = await apiRequest('admin/roles');
      console.log('StaffManagement: apiRequest response', response);
      if (response.ok) {
        const data = await response.json();
        console.log('StaffManagement: roles data', data);
        // Parse permissions if they are strings
        const parsedRoles = data.map(role => ({
          ...role,
          permissions: typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions || '{}') 
            : (role.permissions || {})
        }));
        console.log('StaffManagement: parsedRoles', parsedRoles);
        setRoles(parsedRoles.filter(r => r.id !== 12)); // Exclude resident role
      } else {
        console.log('StaffManagement: response not ok');
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  // --- Staff Handlers ---

  const handleOpenStaffDialog = (staffMember = null) => {
    setActiveStep(0); // Reset wizard
    if (staffMember) {
      setEditingStaff(staffMember);
      setStaffForm({
        username: staffMember.username || '',
        email: staffMember.email || '',
        first_name: staffMember.first_name || '',
        last_name: staffMember.last_name || '',
        role_id: staffMember.role || '',
        is_active: staffMember.is_active !== false,
        password: '',
        confirm_password: ''
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role_id: '',
        is_active: true,
        password: '',
        confirm_password: ''
      });
    }
    setStaffDialogOpen(true);
  };

  const handleCloseStaffDialog = () => {
    setStaffDialogOpen(false);
    setEditingStaff(null);
    setActiveStep(0);
    setError('');
    setSuccess('');
  };

  const validateStep = (step) => {
    if (step === 0) { // Account Details
        if (!staffForm.username) return 'Username is required';
        if (!staffForm.email) return 'Email is required';
        if (!editingStaff && !staffForm.password) return 'Password is required';
        if (!editingStaff && staffForm.password !== staffForm.confirm_password) return 'Passwords do not match';
        return null;
    }
    if (step === 1) { // Personal Info
        if (!staffForm.first_name) return 'First Name is required';
        if (!staffForm.last_name) return 'Last Name is required';
        return null;
    }
    if (step === 2) { // Role Selection
        if (!staffForm.role_id) return 'Role selection is required';
        return null;
    }
    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStep(activeStep);
    if (errorMsg) {
        setError(errorMsg);
        return;
    }
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStaffSubmit = async () => {
    // Final Validation
    if (!staffForm.username || !staffForm.role_id) {
        setError('Username and Role are required');
        return;
    }
    if (!editingStaff && !staffForm.password) {
        setError('Password is required for new users');
        return;
    }

    try {
      const url = editingStaff ? `admin/staff/${editingStaff.id}` : 'admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      
      const submitData = { ...staffForm };
      // Remove confirm_password and empty password if editing
      delete submitData.confirm_password;
      if (editingStaff && !submitData.password) {
        delete submitData.password;
      }

      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        setSuccess(editingStaff ? 'Staff updated successfully' : 'Staff created successfully');
        fetchStaff();
        handleCloseStaffDialog();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Operation failed');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const response = await apiRequest(`admin/staff/${staffId}`, { method: 'DELETE' });
      if (response.ok) {
        setSuccess('Staff deleted successfully');
        fetchStaff();
      } else {
        setError('Failed to delete staff');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const response = await apiRequest(`admin/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (response.ok) {
        setSuccess('Staff status updated');
        fetchStaff();
      } else {
        setError('Failed to update staff status');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  // --- Role Handlers ---

  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        role_name: role.role_name || '',
        description: role.description || '',
        hierarchy_level: role.hierarchy_level || 1,
        permissions: role.permissions || {}
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        role_name: '',
        description: '',
        hierarchy_level: 1,
        permissions: {}
      });
    }
    setRoleDialogOpen(true);
  };

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
    setEditingRole(null);
  };

  const handleRolePermissionChange = (module, action, checked) => {
    setRoleForm(prev => {
      const currentModulePerms = prev.permissions[module] || [];
      let newModulePerms;
      
      if (checked) {
        newModulePerms = [...currentModulePerms, action];
      } else {
        newModulePerms = currentModulePerms.filter(a => a !== action);
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: newModulePerms
        }
      };
    });
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.role_name) {
        setError('Role Name is required');
        return;
    }

    try {
      const url = editingRole ? `admin/roles/${editingRole.id}` : 'admin/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        setSuccess(editingRole ? 'Role updated successfully' : 'Role created successfully');
        fetchRoles();
        handleCloseRoleDialog();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Operation failed');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDeleteRole = (roleId, roleName) => {
    setConfirmationAction({
      type: 'delete_role',
      id: roleId,
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${roleName}"?`,
      icon: 'warning'
    });
    setConfirmationModalOpen(true);
  };

  const handleConfirmationConfirm = async () => {
    if (confirmationAction?.type === 'delete_role') {
      try {
        const response = await apiRequest(`admin/roles/${confirmationAction.id}`, { method: 'DELETE' });
        if (response.ok) {
          setSuccess('Role deleted successfully');
          fetchRoles();
        } else {
          setError('Failed to delete role');
        }
      } catch (error) {
        setError('Network error occurred');
      }
    }
    setConfirmationModalOpen(false);
    setConfirmationAction(null);
  };

  // --- Filtering & Stats ---

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.role_name : `Role ${roleId}`;
  };

  const getRoleColor = (roleId) => {
    // Standardize colors based on role ID or hierarchy
    if (roleId === 1) return 'error'; // Admin
    if (roleId === 2) return 'primary'; // Captain
    if (roleId === 6) return 'secondary'; // Secretary
    return 'default';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = !staffSearch || 
      member.username?.toLowerCase().includes(staffSearch.toLowerCase()) ||
      member.first_name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
      member.email?.toLowerCase().includes(staffSearch.toLowerCase());
    
    const matchesRole = !staffRoleFilter || member.role === parseInt(staffRoleFilter);

    return matchesSearch && matchesRole;
  });

  const staffStats = {
    total: staff.length,
    active: staff.filter(s => s.is_active !== false).length,
    inactive: staff.filter(s => s.is_active === false).length
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminPanelSettings /> Administration & Access Control
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          indicatorColor="primary" 
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<Person />} label="Staff Directory" />
          <Tab icon={<Security />} label="Role Management" />
        </Tabs>
      </Paper>

      {/* --- STAFF DIRECTORY TAB --- */}
      {tabValue === 0 && (
        <Box>
          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{staffStats.total}</Typography>
                  <Typography variant="body2">Total Staff</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{staffStats.active}</Typography>
                  <Typography variant="body2">Active Staff</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">{staffStats.inactive}</Typography>
                  <Typography variant="body2">Inactive Staff</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Controls */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={staffRoleFilter}
                    onChange={(e) => setStaffRoleFilter(e.target.value)}
                    label="Filter by Role"
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenStaffDialog()}
                  sx={{ height: 56 }}
                >
                  Add Staff
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No staff found</TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.username}</TableCell>
                      <TableCell>{member.full_name || 'N/A'}</TableCell>
                      <TableCell>{member.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.role_name || `Role ${member.role}`} 
                          color={getRoleColor(member.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.is_active !== false ? 'Active' : 'Inactive'}
                          color={member.is_active !== false ? 'success' : 'error'}
                          size="small"
                          icon={member.is_active !== false ? <CheckCircle /> : <Block />}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenStaffDialog(member)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={member.is_active !== false ? "Deactivate" : "Activate"}>
                          <IconButton 
                            onClick={() => toggleStaffStatus(member.id, member.is_active !== false)}
                            color={member.is_active !== false ? 'warning' : 'success'}
                          >
                            {member.is_active !== false ? <Block /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteStaff(member.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* --- ROLE MANAGEMENT TAB --- */}
      {tabValue === 1 && (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenRoleDialog()}
            >
              Create New Role
            </Button>
          </Box>
          
          <Grid container spacing={3} data-testid="role-grid">
            {roles.length === 0 ? (
                <Grid item xs={12}>
                    <Typography align="center" color="textSecondary">No roles found.</Typography>
                </Grid>
            ) : (
                roles.map(role => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {role.role_name}
                      </Typography>
                      <Chip label={`Level ${role.hierarchy_level}`} size="small" variant="outlined" />
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {role.description || 'No description provided'}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Permissions Overview:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {Object.entries(role.permissions || {}).map(([module, actions]) => (
                            actions.length > 0 && (
                                <Chip 
                                    key={module} 
                                    label={`${module}: ${actions.length}`} 
                                    size="small" 
                                    sx={{ fontSize: '0.7rem' }}
                                />
                            )
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<Edit />} 
                        onClick={() => handleOpenRoleDialog(role)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Delete />}
                        onClick={() => handleDeleteRole(role.id, role.role_name)}
                        disabled={role.role_name === 'Admin'} // Prevent deleting main admin role
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )))}
          </Grid>
        </Box>
      )}

      {/* --- STAFF DIALOG (USER WIZARD) --- */}
      <Dialog open={staffDialogOpen} onClose={handleCloseStaffDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'New User Creation Wizard'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {editingStaff ? (
             /* SIMPLE FORM FOR EDITING */
             <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Username"
                  fullWidth
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                    label="First Name"
                    fullWidth
                    value={staffForm.first_name}
                    onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                    />
                    <TextField
                    label="Last Name"
                    fullWidth
                    value={staffForm.last_name}
                    onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                    />
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={staffForm.role_id}
                    label="Role"
                    onChange={(e) => setStaffForm({ ...staffForm, role_id: e.target.value })}
                  >
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="New Password (leave blank to keep current)"
                  type="password"
                  fullWidth
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={staffForm.is_active}
                      onChange={(e) => setStaffForm({ ...staffForm, is_active: e.target.checked })}
                    />
                  }
                  label="Active Account"
                />
             </Box>
          ) : (
             /* WIZARD FOR CREATION */
             <Box sx={{ width: '100%', pt: 2 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    <Step key="Account">
                        <StepLabel>Account</StepLabel>
                    </Step>
                    <Step key="Personal">
                        <StepLabel>Personal</StepLabel>
                    </Step>
                    <Step key="Role">
                        <StepLabel>Role</StepLabel>
                    </Step>
                    <Step key="Confirm">
                        <StepLabel>Confirm</StepLabel>
                    </Step>
                </Stepper>

                <Box sx={{ mt: 3, minHeight: 250 }}>
                    {activeStep === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6" gutterBottom>Account Credentials</Typography>
                            <TextField
                                label="Username"
                                fullWidth
                                required
                                value={staffForm.username}
                                onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                required
                                value={staffForm.email}
                                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                required
                                value={staffForm.password}
                                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                fullWidth
                                required
                                value={staffForm.confirm_password}
                                onChange={(e) => setStaffForm({ ...staffForm, confirm_password: e.target.value })}
                            />
                        </Box>
                    )}
                    {activeStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                             <Typography variant="h6" gutterBottom>Personal Information</Typography>
                             <TextField
                                label="First Name"
                                fullWidth
                                required
                                value={staffForm.first_name}
                                onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                            />
                            <TextField
                                label="Last Name"
                                fullWidth
                                required
                                value={staffForm.last_name}
                                onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                            />
                        </Box>
                    )}
                    {activeStep === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                             <Typography variant="h6" gutterBottom>Role Assignment</Typography>
                             <FormControl fullWidth required>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={staffForm.role_id}
                                    label="Role"
                                    onChange={(e) => setStaffForm({ ...staffForm, role_id: e.target.value })}
                                >
                                    {roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Selected Role Description:
                                </Typography>
                                <Typography variant="body2">
                                    {roles.find(r => r.id === staffForm.role_id)?.description || 'Select a role to view description'}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    {activeStep === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6" gutterBottom>Review Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Username</Typography>
                                    <Typography variant="body1">{staffForm.username}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                                    <Typography variant="body1">{staffForm.email}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
                                    <Typography variant="body1">{staffForm.first_name} {staffForm.last_name}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Role</Typography>
                                    <Chip 
                                        label={roles.find(r => r.id === staffForm.role_id)?.role_name || 'Unknown'} 
                                        color="primary" 
                                        size="small" 
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseStaffDialog}>Cancel</Button>
          
          {editingStaff ? (
             <Button onClick={handleStaffSubmit} variant="contained" color="primary">
                Update Staff
             </Button>
          ) : (
             <>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                </Button>
                {activeStep === 3 ? (
                    <Button onClick={handleStaffSubmit} variant="contained" color="primary">
                        Create User
                    </Button>
                ) : (
                    <Button onClick={handleNext} variant="contained" color="primary">
                        Next
                    </Button>
                )}
             </>
          )}
        </DialogActions>
      </Dialog>

      {/* --- ROLE DIALOG --- */}
      <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role & Permissions' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.role_name}
                onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                required
                placeholder="e.g. Health Officer"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Hierarchy Level"
                type="number"
                value={roleForm.hierarchy_level}
                onChange={(e) => setRoleForm({ ...roleForm, hierarchy_level: parseInt(e.target.value) })}
                helperText="1=Admin, 10=Low"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VpnKey fontSize="small" /> Permission Configuration
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                {PERMISSION_MODULES.map((module) => (
                    <Accordion key={module.id} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #eee' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">{module.label}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormGroup row>
                                {PERMISSION_ACTIONS.map((action) => {
                                    const isChecked = (roleForm.permissions[module.id] || []).includes(action.id);
                                    return (
                                        <FormControlLabel
                                            key={action.id}
                                            control={
                                                <Checkbox 
                                                    checked={isChecked}
                                                    onChange={(e) => handleRolePermissionChange(module.id, action.id, e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="body2">{action.label}</Typography>}
                                            sx={{ mr: 3 }}
                                        />
                                    );
                                })}
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button onClick={handleRoleSubmit} variant="contained" color="primary">
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        onConfirm={handleConfirmationConfirm}
        title={confirmationAction?.title}
        message={confirmationAction?.message}
        type={confirmationAction?.icon || 'info'}
      />
    </Box>
  );
};

export default StaffManagement;