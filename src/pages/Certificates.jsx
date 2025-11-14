
import React from 'react';
import { Button, Typography, Paper } from '@mui/material';

const Certificates = () => {
  const handleGenerateCertificate = (type) => {
    alert(`Generating ${type} certificate...`);
  };

  return (
    <div>
      <h1>Certificate Issuance</h1>
      <Typography paragraph>
        Select the type of certificate you want to generate.
      </Typography>
      <Paper style={{ padding: '1rem' }}>
        <Button 
          variant="contained" 
          style={{ marginRight: '1rem' }} 
          onClick={() => handleGenerateCertificate('Barangay Clearance')}
        >
          Barangay Clearance
        </Button>
        <Button 
          variant="contained" 
          style={{ marginRight: '1rem' }} 
          onClick={() => handleGenerateCertificate('Certificate of Indigency')}
        >
          Certificate of Indigency
        </Button>
        <Button 
          variant="contained" 
          onClick={() => handleGenerateCertificate('Business Permit')}
        >
          Business Permit
        </Button>
      </Paper>
    </div>
  );
};

export default Certificates;
