import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { Backup as BackupIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const AdminBackup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [backupHistory] = useState([
    { name: 'backup_2025-01-04.sql', date: '2025-01-04 10:30:00', size: '2.1MB', status: 'completed' },
    { name: 'backup_2025-01-03.sql', date: '2025-01-03 10:30:00', size: '2.0MB', status: 'completed' },
    { name: 'backup_2025-01-02.sql', date: '2025-01-02 10:30:00', size: '1.9MB', status: 'completed' }
  ]);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/system-admin/backup', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Backup created successfully: ${data.data.backup_name}` 
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Backup & Restore
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Create Backup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a complete backup of the system database including all residents, cases, and documents.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <BackupIcon />}
                onClick={handleCreateBackup}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Creating Backup...' : 'Create Backup'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Schedule */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Automated backups are scheduled daily at 10:30 PM.
              </Typography>
              <Chip label="Daily Backup: Enabled" color="success" />
            </CardContent>
          </Card>
        </Grid>

        {/* Backup History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup History
              </Typography>
              <List>
                {backupHistory.map((backup, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <BackupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={backup.name}
                      secondary={`${backup.date} • ${backup.size}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label={backup.status} 
                        color="success" 
                        size="small" 
                      />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => setMessage({ type: 'info', text: 'Download functionality would be implemented here' })}
                      >
                        Download
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminBackup;