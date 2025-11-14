
import React, { useState, useEffect } from 'react';
import ResidentModal from '../components/ResidentModal';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  InputAdornment 
} from '@mui/material';
import { Search } from '@mui/icons-material';

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/residents')
      .then(response => response.json())
      .then(data => setResidents(data))
      .catch(error => console.error('Error fetching residents:', error));
  }, []);

  const handleOpenModal = (resident) => {
    setSelectedResident(resident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResident(null);
  };

  const filteredResidents = residents.filter(resident => 
    `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1>Residents</h1>
      <TextField
        label="Search Residents"
        variant="outlined"
        fullWidth
        margin="normal"
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResidents.map((resident) => (
              <TableRow key={resident.id}>
                <TableCell><Avatar src={resident.photoUrl} /></TableCell>
                <TableCell>{`${resident.firstName} ${resident.lastName}`}</TableCell>
                <TableCell>{resident.address}</TableCell>
                <TableCell>{resident.contactNumber}</TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleOpenModal(resident)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedResident && (
        <ResidentModal 
          resident={selectedResident} 
          open={isModalOpen} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default Residents;
