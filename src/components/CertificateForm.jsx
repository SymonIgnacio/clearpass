
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  generateIndigencyCertificate,
  generateResidencyCertificate,
  generateBarangayCertification,
  generateBarangayClearance,
  generateBusinessClearance,
  generateOathOfUndertaking,
  generateGoodMoral,
  generateLowIncomeCertificate,
  generateBirthCertificate
} from '../utils/pdfGenerator';

const CertificateForm = ({ open, handleClose, certificate, formData, setFormData }) => {

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    const barangayName = "[Your Barangay Name]"; // Replace with your actual barangay name
    const captainName = "[Your Captain's Name]"; // Replace with your captain's name

    // 1. Construct the payload for the backend
    const payload = {
      resident_id: 1, // Hardcoded for now, should come from resident selection
      certificate_type_id: certificate.id,
      purpose: formData.purpose || `Request for ${certificate.name}`,
      data: formData,
      issued_by: 1, // Hardcoded for now, should come from logged-in user
      status: 'approved', // Default status
      fee_paid: certificate.fee
    };

    try {
      // 2. Send data to the backend
      const response = await fetch('http://localhost:3001/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create certificate record');
      }

      const newCertificateRecord = await response.json();
      console.log('Certificate record created:', newCertificateRecord);

      // 3. Generate the PDF locally
      switch (certificate.name) {
        case 'Barangay Indigency':
          generateIndigencyCertificate(formData, barangayName, captainName);
          break;
        case 'Barangay Residency':
          generateResidencyCertificate(formData, barangayName, captainName);
          break;
        case 'Barangay Certification':
          generateBarangayCertification(formData, barangayName, captainName);
          break;
        case 'Barangay Clearance':
          generateBarangayClearance(formData, barangayName, captainName);
          break;
        case 'Business Clearance':
          generateBusinessClearance(formData, barangayName, captainName);
          break;
        case 'Oath of Undertaking':
          generateOathOfUndertaking(formData, barangayName, captainName);
          break;
        case 'Good Moral':
          generateGoodMoral(formData, barangayName, captainName);
          break;
        case 'Low Income Certificate':
          generateLowIncomeCertificate(formData, barangayName, captainName);
          break;
        case 'Birth Certificate':
          generateBirthCertificate(formData, barangayName, captainName);
          break;
        default:
          console.error("Unknown certificate type");
      }
      
      handleClose();

    } catch (error) {
      console.error('Error during certificate generation:', error);
      // Optionally, show an error message to the user
    }
  };

  const renderFormFields = () => {
    if (!certificate || !certificate.name) return null;

    switch (certificate.name) {
      case 'Barangay Indigency':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name of Applicant" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="address" label="Complete Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="Specific Purpose" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Barangay Residency':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name of Resident" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="address" label="Address within Barangay" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="periodOfResidency" label="Period of Residency" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="Purpose" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Barangay Certification':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name of Individual" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="address" label="Complete Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="lengthOfStay" label="Length of Stay" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="Purpose of Certification" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Barangay Clearance':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="dateOfBirth" label="Date of Birth" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} onChange={handleChange} />
            <TextField margin="dense" name="address" label="Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="contactNumber" label="Contact Number" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="lengthOfStay" label="Length of Stay" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="Purpose" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Business Clearance':
        return (
          <>
            <TextField autoFocus margin="dense" name="businessName" label="Business Name" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="businessAddress" label="Business Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="ownerName" label="Name of Owner" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="typeOfBusiness" label="Type of Business" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Oath of Undertaking':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="address" label="Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="statement" label="Statement of Promise/Undertaking" type="text" fullWidth multiline rows={4} variant="standard" onChange={handleChange} />
          </>
        );
      case 'Good Moral':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="dateOfBirth" label="Date of Birth" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} onChange={handleChange} />
            <TextField margin="dense" name="address" label="Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="School Year or Purpose" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Low Income Certificate':
        return (
          <>
            <TextField autoFocus margin="dense" name="fullName" label="Full Name of Applicant" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="address" label="Address" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="householdMembers" label="Number of Family Members" type="number" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="sourceOfIncome" label="Source of Income" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="monthlyIncome" label="Estimated Monthly Income" type="number" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="purpose" label="Purpose of the Certificate" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      case 'Birth Certificate':
        return (
          <>
            <TextField autoFocus margin="dense" name="childFullName" label="Full Name of Child" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="dateOfBirth" label="Date of Birth" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} onChange={handleChange} />
            <TextField margin="dense" name="placeOfBirth" label="Place of Birth" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="gender" label="Sex/Gender" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="motherFullName" label="Full Name of Mother" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="fatherFullName" label="Full Name of Father" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="parentsNationality" label="Nationality of Parents" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="parentsOccupation" label="Occupation of Parents" type="text" fullWidth variant="standard" onChange={handleChange} />
            <TextField margin="dense" name="parentsAddress" label="Address of Parents at time of birth" type="text" fullWidth variant="standard" onChange={handleChange} />
          </>
        );
      default:
        return <p>Form not available for this certificate type.</p>;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Generate {certificate.name}</DialogTitle>
      <DialogContent>
        {renderFormFields()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleGenerate}>Generate</Button> 
      </DialogActions>
    </Dialog>
  );
};

export default CertificateForm;
