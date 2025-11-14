
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Modal, 
  Box, 
  Typography,
  Chip,
  Grid
} from '@mui/material';
import { Gavel, Warning, CheckCircle, Cancel, Schedule } from '@mui/icons-material';

const Blotter = () => {
  const [blotterCases, setBlotterCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/blotter')
      .then(response => response.json())
      .then(data => setBlotterCases(data))
      .catch(error => console.error('Error fetching blotter cases:', error));
  }, []);

  const handleOpenModal = (blotterCase) => {
    setSelectedCase(blotterCase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'error';
      case 'resolved': return 'success';
      case 'dismissed': return 'default';
      case 'referred': return 'warning';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'moderate': return 'info';
      case 'minor': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Warning />;
      case 'resolved': return <CheckCircle />;
      case 'dismissed': return <Cancel />;
      case 'referred': return <Schedule />;
      default: return null;
    }
  };

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    overflow: 'auto'
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        <Gavel style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Blotter Records Management
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Incident reports and cases. Active blotters automatically block certificate issuance for major/critical cases.
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Incident Type</TableCell>
              <TableCell>Complainant</TableCell>
              <TableCell>Respondent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blotterCases.map((blotterCase) => (
              <TableRow key={blotterCase.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {blotterCase.case_number}
                  </Typography>
                </TableCell>
                <TableCell>{blotterCase.incident_type}</TableCell>
                <TableCell>{blotterCase.complainant_name || 'N/A'}</TableCell>
                <TableCell>{blotterCase.respondent_name || blotterCase.respondent_name || 'Unknown'}</TableCell>
                <TableCell>
                  <Chip 
                    icon={getStatusIcon(blotterCase.status)}
                    label={blotterCase.status.toUpperCase()} 
                    color={getStatusColor(blotterCase.status)} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={blotterCase.severity.toUpperCase()} 
                    color={getSeverityColor(blotterCase.severity)} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(blotterCase.incident_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleOpenModal(blotterCase)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedCase && (
        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <Box sx={style}>
            <Typography variant="h5" component="h2" gutterBottom>
              Case Details - {selectedCase.case_number}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Incident Type:</Typography>
                <Typography variant="body1">{selectedCase.incident_type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Date & Time:</Typography>
                <Typography variant="body1">
                  {new Date(selectedCase.incident_date).toLocaleDateString()}
                  {selectedCase.incident_time && ` at ${selectedCase.incident_time}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Location:</Typography>
                <Typography variant="body1">{selectedCase.location}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Sitio:</Typography>
                <Typography variant="body1">{selectedCase.sitio_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Complainant:</Typography>
                <Typography variant="body1">{selectedCase.complainant_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Respondent:</Typography>
                <Typography variant="body1">{selectedCase.respondent_name || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description:</Typography>
                <Typography variant="body1" paragraph>{selectedCase.description}</Typography>
              </Grid>
              {selectedCase.resolution && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Resolution:</Typography>
                  <Typography variant="body1">{selectedCase.resolution}</Typography>
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Chip 
                label={`Status: ${selectedCase.status.toUpperCase()}`} 
                color={getStatusColor(selectedCase.status)}
              />
              <Chip 
                label={`Severity: ${selectedCase.severity.toUpperCase()}`} 
                color={getSeverityColor(selectedCase.severity)}
              />
            </Box>
            
            <Button onClick={handleCloseModal} sx={{ mt: 2 }} variant="contained">
              Close
            </Button>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default Blotter;
