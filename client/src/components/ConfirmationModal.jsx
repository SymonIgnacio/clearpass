import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info', // info, success, warning, error
  showInput = false,
  inputLabel = '',
  inputPlaceholder = '',
  inputRequired = false,
  inputValue = '',
  onInputChange = () => {}
}) => {
  const [localInputValue, setLocalInputValue] = useState('');

  const handleConfirm = () => {
    if (showInput && inputRequired && !localInputValue.trim()) {
      return;
    }
    onConfirm(showInput ? localInputValue : undefined);
    setLocalInputValue('');
  };

  const handleClose = () => {
    setLocalInputValue('');
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />;
      case 'warning': return <WarningIcon color="warning" sx={{ fontSize: 40 }} />;
      case 'error': return <ErrorIcon color="error" sx={{ fontSize: 40 }} />;
      default: return <InfoIcon color="info" sx={{ fontSize: 40 }} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, p: 1 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIcon()}
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: showInput ? 2 : 0, mt: 1 }}>
          {message}
        </Typography>
        
        {showInput && (
          <TextField
            autoFocus
            margin="dense"
            label={inputLabel}
            placeholder={inputPlaceholder}
            type="text"
            fullWidth
            variant="outlined"
            value={localInputValue}
            onChange={(e) => setLocalInputValue(e.target.value)}
            required={inputRequired}
            error={inputRequired && !localInputValue.trim()}
            helperText={inputRequired && !localInputValue.trim() ? "This field is required" : ""}
          />
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" variant="text">
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color={getColor()} 
          variant="contained"
          disabled={showInput && inputRequired && !localInputValue.trim()}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
