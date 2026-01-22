import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CredentialsModal = ({ open, onClose, credentials }) => {
  if (!credentials) return null;

  const handleCopy = () => {
    const text = `
Resident ID: ${credentials.resident_code}
User Account: ${credentials.user_email}
Temporary Password: ${credentials.temp_password}
    `.trim();

    navigator.clipboard.writeText(text);
    // In a real app, show a toast here
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'success.main',
          color: 'white',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant='h6'>Resident Created Successfully</Typography>
        </Box>
        <IconButton onClick={onClose} size='small' sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 1 }}>
          <CheckCircleIcon color='success' sx={{ fontSize: 40 }} />
          <Typography variant='body1'>
            The resident profile has been created and a user account has been generated.
          </Typography>
        </Box>

        <Paper variant='outlined' sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant='caption' color='text.secondary' display='block'>
              Resident ID
            </Typography>
            <Typography variant='h6' sx={{ fontFamily: 'monospace' }}>
              {credentials.resident_code}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant='caption' color='text.secondary' display='block'>
              User Account (Email)
            </Typography>
            <Typography variant='h6' sx={{ fontFamily: 'monospace' }}>
              {credentials.user_email}
            </Typography>
          </Box>

          <Box>
            <Typography variant='caption' color='text.secondary' display='block'>
              Temporary Password
            </Typography>
            <Typography
              variant='h6'
              sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 'bold' }}
            >
              {credentials.temp_password}
            </Typography>
          </Box>
        </Paper>

        <Alert severity='warning' sx={{ mb: 2 }}>
          <Typography variant='body2'>
            <strong>Important:</strong> Provide these credentials to the resident securely. They
            will need the email and temporary password for their first login.
          </Typography>
        </Alert>

        <Typography variant='body2' color='text.secondary' align='center'>
          The temporary password is only valid until the first login, where they will be prompted to
          change it.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
        <Button onClick={handleCopy} variant='contained' startIcon={<ContentCopyIcon />}>
          Copy Credentials
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CredentialsModal;
