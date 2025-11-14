
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
  InputAdornment,
  Chip,
  Typography
} from '@mui/material';
import { Search, Person, LocationOn } from '@mui/icons-material';

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
    `${resident.first_name} ${resident.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.sitio_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSpecialCategories = (resident) => {
    const categories = [];
    if (resident.is_senior) categories.push({ label: 'Senior', color: 'primary' });
    if (resident.is_pwd) categories.push({ label: 'PWD', color: 'secondary' });
    if (resident.is_4ps) categories.push({ label: '4Ps', color: 'success' });
    if (resident.is_single_parent) categories.push({ label: 'Single Parent', color: 'warning' });
    return categories;
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        <Person style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Residents Management
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Total Population: ~48,000 across 4 sitios (Batia Proper, Northville 5, St. Martha, AFP/PNP)
      </Typography>
      
      <TextField
        label="Search Residents by Name or Sitio"
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
              <TableCell>Address & Sitio</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Categories</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResidents.map((resident) => (
              <TableRow key={resident.id}>
                <TableCell>
                  <Avatar src={resident.photo_url}>
                    {`${resident.first_name?.[0]}${resident.last_name?.[0]}`}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {`${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {resident.occupation || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {`${resident.house_number || ''} ${resident.street || ''}`}
                  </Typography>
                  <Chip 
                    icon={<LocationOn />} 
                    label={resident.sitio_name} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{resident.contact_number || 'N/A'}</TableCell>
                <TableCell>
                  {getSpecialCategories(resident).map((category, index) => (
                    <Chip 
                      key={index}
                      label={category.label} 
                      color={category.color} 
                      size="small" 
                      style={{ margin: '2px' }}
                    />
                  ))}
                </TableCell>
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
