
import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Typography 
} from '@mui/material';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([
    { id: 1, text: 'Community meeting on Saturday at 10 AM.' },
    { id: 2, text: 'Free vaccination drive next week.' },
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const handleAddAnnouncement = () => {
    if (newAnnouncement.trim()) {
      setAnnouncements([
        ...announcements, 
        { id: Date.now(), text: newAnnouncement.trim() },
      ]);
      setNewAnnouncement('');
    }
  };

  return (
    <div>
      <h1>Announcements</h1>
      <Paper style={{ padding: '1rem', marginBottom: '1rem' }}>
        <TextField
          label="New Announcement"
          variant="outlined"
          fullWidth
          value={newAnnouncement}
          onChange={(e) => setNewAnnouncement(e.target.value)}
          margin="normal"
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAddAnnouncement}
        >
          Post Announcement
        </Button>
      </Paper>
      <Typography variant="h6">Current Announcements</Typography>
      <List>
        {announcements.map(announcement => (
          <ListItem key={announcement.id} component={Paper} style={{ marginBottom: '0.5rem' }}>
            <ListItemText primary={announcement.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default Announcements;
