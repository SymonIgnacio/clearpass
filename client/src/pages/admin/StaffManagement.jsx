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
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Person,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { apiRequest } from '../../utils/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    is_active: true,
    password: ''
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
      const response = await apiRequest('admin/roles');
      if (response.ok) {
        const data = await response.json();
        console.log('Roles fetched:', data);
        // Filter out residents and only show staff roles
        const staffRoles = data.filter(role => role.id !== 12);
        setRoles(staffRoles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        username: staffMember.username || '',
        email: staffMember.email || '',
        first_name: staffMember.first_name || '',
        last_name: staffMember.last_name || '',
        role_id: staffMember.role_id || '',
        is_active: staffMember.is_active !== false,
        password: ''
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role_id: '',
        is_active: true,
        password: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStaff(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      const url = editingStaff ? `admin/staff/${editingStaff.id}` : 'admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      
      const submitData = { ...formData };
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
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Operation failed');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleDelete = async (staffId) => {
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

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.role_name : `Role ${roleId}`;
  };

  const getRoleColor = (roleId) => {
    const roleColors = {
      1: 'error',    // IT Admin
      2: 'primary',  // Captain  
      3: 'secondary', // Secretary
      4: 'success',  // Clerk
      5: 'warning',  // Blotter Officer
      6: 'info',     // Officer
      12: 'default'  // Resident
    };
    return roleColors[roleId] || 'default';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = !searchTerm || 
      member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || member.role_id === parseInt(roleFilter);

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
        <Person /> Staff Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Statistics Cards */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="medium">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
                sx={{ minWidth: 200 }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      minWidth: 200,
                    },
                  },
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ mr: 1 }}
            >
              Add Staff
            </Button>
            <IconButton onClick={fetchStaff}>
              <Refresh />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Staff Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No staff found
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.full_name || 'N/A'}</TableCell>
                  <TableCell>{member.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={member.role_name || `Role ${member.role_id}`} 
                      color={getRoleColor(member.role_id)}
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
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(member)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleStaffStatus(member.id, member.is_active !== false)}
                      color={member.is_active !== false ? 'error' : 'success'}
                    >
                      {member.is_active !== false ? <Block /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff' : 'Add New Staff'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="medium">
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  label="Role"
                  required
                  sx={{ minWidth: 300 }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        minWidth: 300,
                      },
                    },
                  }}
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id} sx={{ minHeight: 48 }}>
                      {role.role_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editingStaff ? "New Password (leave blank to keep current)" : "Password"}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingStaff}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active Staff"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;