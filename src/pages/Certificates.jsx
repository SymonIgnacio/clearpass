import React, { useState, useEffect } from 'react';
import { Button, Typography, Paper, Grid, Card, CardContent, Chip } from '@mui/material';
import CertificateForm from '../components/CertificateForm';

const Certificates = () => {
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [certificateTypes, setCertificateTypes] = useState([]);

  useEffect(() => {
    const fetchCertificateTypes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/certificate-types');
        if (!response.ok) {
          throw new Error('Failed to fetch certificate types');
        }
        const data = await response.json();
        // Augment with client-side descriptions for now
        const augmentedData = data.map(cert => ({
          ...cert,
          description: cert.description || 'No description available.',
          validity: `${cert.validity_days} days`
        }));
        setCertificateTypes(augmentedData);
      } catch (error) {
        console.error(error);
        // Fallback to some default data or show an error
      }
    };
    fetchCertificateTypes();
  }, []);

  const handleOpenForm = (certificate) => {
    setSelectedCertificate(certificate);
    setFormData({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCertificate(null);
    setFormData({});
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Certificate Issuance</Typography>
      <Typography paragraph color="textSecondary">
        Select the type of certificate to generate. All certificates include QR verification and blotter integration.
      </Typography>
      
      <Grid container spacing={3}>
        {certificateTypes.map((cert) => (
          <Grid item xs={12} sm={6} md={4} key={cert.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{cert.name}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {cert.description}
                </Typography>
                <div style={{ marginBottom: '1rem' }}>
                  <Chip label={`₱${cert.fee}`} color="primary" size="small" style={{ marginRight: '0.5rem' }} />
                  <Chip label={cert.validity} color="secondary" size="small" />
                </div>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleOpenForm(cert)}
                >
                  Generate Certificate
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedCertificate && (
        <CertificateForm 
          open={isFormOpen}
          handleClose={handleCloseForm}
          certificate={selectedCertificate}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </div>
  );
};

export default Certificates;
