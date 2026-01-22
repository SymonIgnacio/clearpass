import React, { useEffect, useState } from 'react';
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
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QRCode from 'qrcode';

const QRCodeModal = ({ open, onClose, qrCode, residentName }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      if (!qrCode) return;

      setLoading(true);
      try {
        const url = await QRCode.toDataURL(qrCode, {
          width: 256,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      generateQR();
    }
  }, [qrCode, open]);

  const handlePrint = () => {
    // Open a new window for printing the ID card
    window.open(`/print-id/${qrCode}`, '_blank');
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
          bgcolor: 'primary.main',
          color: 'white',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon />
          <Typography variant='h6'>Resident QR Code</Typography>
        </Box>
        <IconButton onClick={onClose} size='small' sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
      >
        <Typography variant='h6' align='center' gutterBottom>
          {residentName}
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'white',
            border: '1px solid #e0e0e0',
            minHeight: 250,
            minWidth: 250,
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${residentName}`}
              style={{ width: '100%', maxWidth: 200, height: 'auto' }}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <QrCodeIcon sx={{ fontSize: 150, color: 'text.primary', opacity: 0.8 }} />
              <Typography variant='caption' display='block' color='text.secondary' sx={{ mt: 1 }}>
                (QR Visualization)
              </Typography>
            </Box>
          )}
        </Paper>

        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            QR Hash Code
          </Typography>
          <Paper
            variant='outlined'
            sx={{
              p: 2,
              bgcolor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              textAlign: 'center',
            }}
          >
            {qrCode}
          </Paper>
        </Box>

        <Typography variant='body2' color='text.secondary' align='center'>
          This QR code uniquely identifies the resident and can be used for attendance, document
          requests, and verification purposes.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
        <Button onClick={handlePrint} variant='contained' startIcon={<PrintIcon />}>
          Print ID Card
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeModal;
