
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
  Typography 
} from '@mui/material';

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

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <div>
      <h1>Blotter Records</h1>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Complainant</TableCell>
              <TableCell>Respondent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date Filed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blotterCases.map((blotterCase) => (
              <TableRow key={blotterCase.id}>
                <TableCell>{blotterCase.caseNumber}</TableCell>
                <TableCell>{blotterCase.complainantId}</TableCell> {/* Replace with actual name later */}
                <TableCell>{blotterCase.respondentId || 'N/A'}</TableCell> {/* Replace with actual name later */}
                <TableCell>{blotterCase.status}</TableCell>
                <TableCell>{blotterCase.dateFiled}</TableCell>
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
            <Typography variant="h6" component="h2">
              Case Details
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <strong>Statement:</strong> {selectedCase.statement}
            </Typography>
            <Button onClick={handleCloseModal} sx={{ mt: 2 }}>Close</Button>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default Blotter;
