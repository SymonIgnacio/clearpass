import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, List, ListItem, ListItemText, Alert } from '@mui/material';
import { api } from '../../utils/api';

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await api.get('/admin/backups');
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/admin/backups/create');
      setMessage({ type: 'success', text: 'Backup created successfully' });
      fetchBackups();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Backup</Typography>
      
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button variant="contained" onClick={createBackup} disabled={loading}>
            {loading ? 'Creating Backup...' : 'Create Backup'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Restore Points</Typography>
          <List>
            {backups.length === 0 ? (
              <ListItem><ListItemText primary="No backups available" /></ListItem>
            ) : (
              backups.map((backup, idx) => (
                <ListItem key={idx}>
                  <ListItemText 
                    primary={backup.name} 
                    secondary={`Created: ${new Date(backup.created_at).toLocaleString()} | Size: ${backup.size}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Backup;
