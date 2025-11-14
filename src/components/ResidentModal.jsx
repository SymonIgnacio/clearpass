
import React from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Grid 
} from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '800px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const ResidentModal = ({ resident, open, onClose }) => {
  if (!resident) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h4" component="h2" gutterBottom>
          Resident Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} style={{ textAlign: 'center' }}>
            <Avatar src={resident.photoUrl} sx={{ width: 150, height: 150, margin: 'auto' }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h6">{`${resident.firstName} ${resident.middleName} ${resident.lastName} ${resident.suffix}`}</Typography>
            <Typography><strong>Date of Birth:</strong> {resident.dateOfBirth}</Typography>
            <Typography><strong>Gender:</strong> {resident.gender}</Typography>
            <Typography><strong>Address:</strong> {resident.address}</Typography>
            <Typography><strong>Sitio:</strong> {resident.sitio}</Typography>
            <Typography><strong>Contact:</strong> {resident.contactNumber}</Typography>
            <Typography><strong>Email:</strong> {resident.email}</Typography>
            <Typography><strong>Occupation:</strong> {resident.occupation}</Typography>
            <Typography><strong>Education:</strong> {resident.education}</Typography>
            <Typography><strong>Voter:</strong> {resident.isVoter ? 'Yes' : 'No'}</Typography>
            <Typography><strong>Senior Citizen:</strong> {resident.isSenior ? 'Yes' : 'No'}</Typography>
            <Typography><strong>PWD:</strong> {resident.isPWD ? 'Yes' : 'No'}</Typography>
            <Typography><strong>4P's Member:</strong> {resident.is4Ps ? 'Yes' : 'No'}</Typography>
            <Typography><strong>Date Registered:</strong> {resident.dateRegistered}</Typography>
          </Grid>
        </Grid>
        <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button>
      </Box>
    </Modal>
  );
};

export default ResidentModal;
