import React, { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload, UploadFile } from '@mui/icons-material';
import { uploadVerification } from '../utils/api';

const VerificationUploadModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size too large (max 5MB)');
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', 'Proof of Residency');
      formData.append('description', 'Initial residency verification upload');

      await uploadVerification(formData);
      
      if (onSuccess) onSuccess();
      onClose();
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => !uploading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Proof of Residency Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          To activate your account, please upload a valid proof of residency (e.g., Billing Statement, Government ID with Address).
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          border: '2px dashed', 
          borderColor: 'grey.300', 
          borderRadius: 2, 
          p: 4, 
          mb: 3,
          cursor: 'pointer',
          bgcolor: 'grey.50',
          '&:hover': { bgcolor: 'grey.100' }
        }}>
          <input
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            id="verification-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="verification-file-upload">
            <Button variant="outlined" component="span" startIcon={<UploadFile />}>
              Select File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={onClose} 
            disabled={uploading}
          >
            Skip for Now
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={uploading && <CircularProgress size={20} color="inherit" />}
          >
            {uploading ? 'Uploading...' : 'Upload Verification'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default VerificationUploadModal;
