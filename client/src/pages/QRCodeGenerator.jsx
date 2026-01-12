import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import { Download, QrCode, ContentCopy, Refresh } from '@mui/icons-material'
import QRCode from 'qrcode'
import { useNotifications } from '../contexts/NotificationContext'

const QRCodeGenerator = () => {
  const { notify } = useNotifications()
  const [text, setText] = useState('')
  const [size, setSize] = useState(256)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [errorCorrection, setErrorCorrection] = useState('M')
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const canvasRef = useRef(null)

  const generateQR = async () => {
    if (!text) {
      setQrDataUrl(null)
      return
    }

    setLoading(true)
    try {
      const opts = {
        errorCorrectionLevel: errorCorrection,
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: fgColor,
          light: bgColor
        },
        width: size
      }

      // Generate Data URL for preview
      const url = await QRCode.toDataURL(text, opts)
      setQrDataUrl(url)
      
      // Also draw to canvas if needed for other operations
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, text, opts)
      }
    } catch (err) {
      console.error('QR Generation Error:', err)
      notify('Failed to generate QR code', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Debounce generation
  useEffect(() => {
    const timer = setTimeout(() => {
      generateQR()
    }, 500)
    return () => clearTimeout(timer)
  }, [text, size, fgColor, bgColor, errorCorrection])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.png`
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify('QR Code downloaded successfully', 'success')
  }

  const handleCopy = async () => {
    if (!qrDataUrl) return
    try {
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      notify('QR Code copied to clipboard', 'success')
    } catch (err) {
      console.error('Copy failed:', err)
      notify('Failed to copy to clipboard', 'error')
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <QrCode fontSize="large" />
        QR Code Generator
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Generate custom QR codes for URLs, text, or resident verification.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Configuration</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <TextField
                  label="Content (URL or Text)"
                  multiline
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to encode..."
                  fullWidth
                  variant="outlined"
                />

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Foreground Color"
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Background Color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Typography gutterBottom>Size: {size}px</Typography>
                  <Slider
                    value={size}
                    onChange={(_, val) => setSize(val)}
                    min={128}
                    max={1024}
                    step={32}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Error Correction Level</InputLabel>
                  <Select
                    value={errorCorrection}
                    label="Error Correction Level"
                    onChange={(e) => setErrorCorrection(e.target.value)}
                  >
                    <MenuItem value="L">Low (7%)</MenuItem>
                    <MenuItem value="M">Medium (15%)</MenuItem>
                    <MenuItem value="Q">Quartile (25%)</MenuItem>
                    <MenuItem value="H">High (30%)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>Preview</Typography>
              
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 4, 
                  bgcolor: '#f5f5f5', // Neutral background to show transparency/colors clearly
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                  width: '100%',
                  maxWidth: 500,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {loading ? (
                  <CircularProgress />
                ) : text ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Generated QR Code" 
                    style={{ maxWidth: '100%', height: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <QrCode sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                    <Typography>Enter text to generate a QR code</Typography>
                  </Box>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Paper>

              {text && (
                <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<Download />} 
                    onClick={handleDownload}
                    size="large"
                  >
                    Download PNG
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<ContentCopy />} 
                    onClick={handleCopy}
                    size="large"
                  >
                    Copy Image
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default QRCodeGenerator
