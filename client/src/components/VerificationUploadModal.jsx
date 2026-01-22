import React, { useState } from 'react';
import { Dialog, Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { CloudUpload, UploadFile } from '@mui/icons-material';
import { uploadVerification } from '../utils/api';

const VerificationUploadModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = event => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError('File size too large (max 5MB)');
        setFile(null);
      } else {
        setError('');
        setSuccess('');
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', 'Proof of Residency'); // Explicit type
    formData.append('description', 'Initial proof of residency upload');

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await uploadVerification(formData);

      // Check if response is OK (200-299)
      if (response.ok) {
        await response.json();
        // If we get here, the upload was successful according to the server
        setSuccess('Upload successful! Your document is under review.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        // Try to parse error message from server
        let errorMessage = 'Upload failed. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // Could not parse JSON, stick with default or statusText
          errorMessage = `Upload failed: ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !uploading && onClose()} maxWidth='sm' fullWidth>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
          Proof of Residency Required
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
          To activate your account, please upload a valid proof of residency (e.g., Billing
          Statement, Government ID with Address).
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            mb: 3,
            cursor: 'pointer',
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <input
            accept='image/*,.pdf'
            style={{ display: 'none' }}
            id='verification-file-upload'
            type='file'
            onChange={handleFileChange}
          />
          <label htmlFor='verification-file-upload'>
            <Button variant='outlined' component='span' startIcon={<UploadFile />}>
              Select File
            </Button>
          </label>
          {file && (
            <Typography variant='body2' color='text.primary' sx={{ mt: 2, fontWeight: 500 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={uploading}>
            Skip for Now
          </Button>
          <Button
            variant='contained'
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={uploading && <CircularProgress size={20} color='inherit' />}
          >
            {uploading ? 'Uploading...' : 'Upload Verification'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default VerificationUploadModal;
