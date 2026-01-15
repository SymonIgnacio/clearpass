import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import { apiRequest } from '../utils/api'
import { QrCodeScanner, CheckCircle, Error, Info } from '@mui/icons-material'

const QRVerification = () => {
  const [qrHash, setQrHash] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!qrHash.trim()) {
      setError('Please enter a QR hash to verify')
      return
    }

    setError('')

    setLoading(true)
    setVerificationResult(null)

    try {
      const response = await apiRequest('/documents/verify-qr', {
        method: 'POST',
        body: {
          qr_code_data: qrHash.trim()
        }
      })
      const data = await response.json()
      setVerificationResult(data)
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        status: 'ERROR',
        message: 'Network error. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleVerify()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'VALID': return 'success'
      case 'INVALID': return 'error'
      case 'ERROR': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VALID': return <CheckCircle />
      case 'INVALID': return <Error />
      case 'ERROR': return <Info />
      default: return <Info />
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
        QR Code Verification System
      </Typography>

      <Typography paragraph sx={{ mb: 4 }}>
        Verify the authenticity of Barangay IDs and certificates by scanning or entering their QR codes.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verify QR Code
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="QR Code Hash"
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter QR code hash or scan with camera"
                  helperText="Scan QR code or manually enter the hash value"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVerify}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <QrCodeScanner />}
                >
                  {loading ? 'Verifying...' : 'Verify QR Code'}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <strong>How to verify:</strong><br />
                1. Scan the QR code on a Barangay ID or certificate<br />
                2. Enter the hash value in the field above<br />
                3. Click "Verify QR Code" to check authenticity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {verificationResult && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getStatusIcon(verificationResult.status)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Verification Result
                  </Typography>
                  <Chip
                    label={verificationResult.status}
                    color={getStatusColor(verificationResult.status)}
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <Alert
                  severity={getStatusColor(verificationResult.status)}
                  sx={{ mb: 2 }}
                >
                  {verificationResult.message}
                </Alert>

                {verificationResult.status === 'VALID' && verificationResult.type === 'certificate' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Certificate Details
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Certificate #:</strong></Typography>
                        <Typography variant="body2" color="primary">{verificationResult.certificate.number}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Type:</strong></Typography>
                        <Typography variant="body2">{verificationResult.certificate.type}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Resident:</strong></Typography>
                        <Typography variant="body2">{verificationResult.certificate.resident_name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Sitio:</strong></Typography>
                        <Typography variant="body2">{verificationResult.certificate.sitio}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Issued Date:</strong></Typography>
                        <Typography variant="body2">{new Date(verificationResult.certificate.issued_date).toLocaleDateString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Issued By:</strong></Typography>
                        <Typography variant="body2">{verificationResult.certificate.issued_by}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {verificationResult.status === 'VALID' && verificationResult.type === 'barangay_id' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Barangay ID Details
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant="body2"><strong>Name:</strong></Typography>
                        <Typography variant="body2">{verificationResult.resident.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Age:</strong></Typography>
                        <Typography variant="body2">{verificationResult.resident.age}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Sitio:</strong></Typography>
                        <Typography variant="body2">{verificationResult.resident.sitio}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2"><strong>Address:</strong></Typography>
                        <Typography variant="body2">{verificationResult.resident.address}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2"><strong>Contact:</strong></Typography>
                        <Typography variant="body2">{verificationResult.resident.contact}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About QR Verification
          </Typography>
          <Typography variant="body2" paragraph>
            The QR Code Verification System provides a secure way to authenticate Barangay IDs and certificates.
            Each document contains a unique cryptographic hash that can be verified against our database to ensure
            the document's authenticity and prevent counterfeiting.
          </Typography>
          <Typography variant="body2">
            <strong>Security Features:</strong><br />
            • Unique cryptographic hashes for each document<br />
            • Real-time verification against official records<br />
            • Tamper-proof validation system<br />
            • Public verification endpoint for external use
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default QRVerification
