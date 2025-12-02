import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Camera,
  Upload,
  Refresh,
  CheckCircle,
  Error,
  Info,
  DocumentScanner,
  PhotoCamera,
  Edit,
  Save,
  Clear,
  Visibility
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { apiRequest } from '../utils/api';

// Document types and their expected fields
const DOCUMENT_TYPES = {
  barangay_clearance: {
    name: 'Barangay Clearance',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true },
      { key: 'address', label: 'Address', required: true },
      { key: 'birth_date', label: 'Birth Date', required: true },
      { key: 'civil_status', label: 'Civil Status', required: false },
      { key: 'purpose', label: 'Purpose', required: true }
    ]
  },
  cedula: {
    name: 'Community Tax Certificate (Cedula)',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true },
      { key: 'address', label: 'Address', required: true },
      { key: 'birth_date', label: 'Birth Date', required: true },
      { key: 'citizenship', label: 'Citizenship', required: true },
      { key: 'occupation', label: 'Occupation', required: true },
      { key: 'tin', label: 'TIN', required: false }
    ]
  },
  valid_id: {
    name: 'Valid ID',
    fields: [
      { key: 'full_name', label: 'Full Name', required: true },
      { key: 'id_number', label: 'ID Number', required: true },
      { key: 'birth_date', label: 'Birth Date', required: true },
      { key: 'address', label: 'Address', required: false }
    ]
  }
};

const OCRAutoFill = () => {
  const [selectedDocType, setSelectedDocType] = useState('');
  const [captureMode, setCaptureMode] = useState(''); // 'camera' or 'upload'
  const [imageSrc, setImageSrc] = useState(null);
  const [extractedData, setExtractedData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [showWebcam, setShowWebcam] = useState(false);
  const [validationDialog, setValidationDialog] = useState(false);
  const [editedData, setEditedData] = useState({});

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'environment' // Use back camera on mobile
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
    setShowWebcam(false);
    processImage(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        processImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData) => {
    if (!selectedDocType) {
      alert('Please select a document type first');
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation, this would send to OCR service
      // For demo purposes, we'll simulate OCR processing
      const mockOCRResult = await simulateOCRProcessing(selectedDocType, imageData);

      setExtractedData(mockOCRResult.data);
      setEditedData(mockOCRResult.data);
      setConfidence(mockOCRResult.confidence);

      // Show validation dialog for user review
      setValidationDialog(true);

    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateOCRProcessing = async (docType, imageData) => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock OCR results based on document type
    const mockData = {};

    if (docType === 'barangay_clearance') {
      mockData.full_name = 'Juan Dela Cruz';
      mockData.address = '123 Purok 5, Barangay Batia Proper';
      mockData.birth_date = '1990-05-15';
      mockData.civil_status = 'Single';
      mockData.purpose = 'Employment';
    } else if (docType === 'cedula') {
      mockData.full_name = 'Juan Dela Cruz';
      mockData.address = '123 Purok 5, Barangay Batia Proper';
      mockData.birth_date = '1990-05-15';
      mockData.citizenship = 'Filipino';
      mockData.occupation = 'Software Developer';
      mockData.tin = '123-456-789-000';
    } else if (docType === 'valid_id') {
      mockData.full_name = 'Juan Dela Cruz';
      mockData.id_number = '123456789012';
      mockData.birth_date = '1990-05-15';
      mockData.address = '123 Purok 5, Barangay Batia Proper';
    }

    return {
      data: mockData,
      confidence: Math.floor(Math.random() * 20) + 80 // 80-99% confidence
    };
  };

  const handleDataEdit = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveData = () => {
    setExtractedData(editedData);
    setValidationDialog(false);

    // In a real app, this would save to form or continue to next step
    alert('Data saved successfully! Ready to proceed with certificate application.');
  };

  const resetProcess = () => {
    setImageSrc(null);
    setExtractedData({});
    setEditedData({});
    setConfidence(0);
    setSelectedDocType('');
    setCaptureMode('');
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 90) return '#4caf50';
    if (conf >= 80) return '#ff9800';
    return '#f44336';
  };

  const getConfidenceLabel = (conf) => {
    if (conf >= 90) return 'Excellent';
    if (conf >= 80) return 'Good';
    return 'Needs Review';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            OCR Auto-Fill System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Scan documents and automatically fill forms with AI-powered OCR
          </Typography>
        </Box>
      </Box>

      {/* Document Type Selection */}
      <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e8eaed' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Select Document Type
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              label="Document Type"
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, doc]) => (
                <MenuItem key={key} value={key}>
                  {doc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedDocType && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                Required Fields for {DOCUMENT_TYPES[selectedDocType].name}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DOCUMENT_TYPES[selectedDocType].fields.map(field => (
                  <Chip
                    key={field.key}
                    label={field.label}
                    size="small"
                    color={field.required ? 'primary' : 'default'}
                    variant={field.required ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}

          {selectedDocType && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PhotoCamera />}
                onClick={() => {
                  setCaptureMode('camera');
                  setShowWebcam(true);
                }}
                sx={{ borderRadius: 2 }}
              >
                Use Camera
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => {
                  setCaptureMode('upload');
                  fileInputRef.current.click();
                }}
                sx={{ borderRadius: 2 }}
              >
                Upload Image
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Webcam Dialog */}
      <Dialog
        open={showWebcam}
        onClose={() => setShowWebcam(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Camera sx={{ mr: 1 }} />
            Document Scanner
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{
                width: '100%',
                maxWidth: '600px',
                borderRadius: '8px'
              }}
            />
            <Typography variant="body2" sx={{ mt: 2, mb: 3 }}>
              Position the document clearly in the camera frame and ensure good lighting
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWebcam(false)}>Cancel</Button>
          <Button onClick={capture} variant="contained">
            Capture Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing State */}
      {isProcessing && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e8eaed' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Processing Document...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI is analyzing the image and extracting text. This may take a few seconds.
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      )}

      {/* Captured Image Display */}
      {imageSrc && !isProcessing && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e8eaed' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
              Captured Document
            </Typography>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <img
                  src={imageSrc}
                  alt="Captured document"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '8px',
                    border: '2px solid #e8eaed'
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                {confidence > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      OCR Confidence Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={confidence}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e8eaed',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getConfidenceColor(confidence)
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ minWidth: '60px' }}>
                        {confidence}%
                      </Typography>
                    </Box>
                    <Chip
                      label={getConfidenceLabel(confidence)}
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor: getConfidenceColor(confidence),
                        color: 'white'
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => processImage(imageSrc)}
                    sx={{ borderRadius: 2 }}
                  >
                    Re-process
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={resetProcess}
                    sx={{ borderRadius: 2 }}
                  >
                    Start Over
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Display */}
      {Object.keys(extractedData).length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e8eaed' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
              Extracted Information
            </Typography>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>AI Extracted Data:</strong> Please review and edit if necessary before proceeding.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {DOCUMENT_TYPES[selectedDocType].fields.map(field => (
                <Grid item xs={12} sm={6} key={field.key}>
                  <TextField
                    fullWidth
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={extractedData[field.key] || ''}
                    onChange={(e) => handleDataEdit(field.key, e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setValidationDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Review & Edit
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveData}
                sx={{ borderRadius: 2 }}
              >
                Save Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Validation Dialog */}
      <Dialog
        open={validationDialog}
        onClose={() => setValidationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Review Extracted Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Please review the AI-extracted information and make any necessary corrections.
          </Typography>

          <Grid container spacing={3}>
            {DOCUMENT_TYPES[selectedDocType]?.fields.map(field => (
              <Grid item xs={12} sm={6} key={field.key}>
                <TextField
                  fullWidth
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  value={editedData[field.key] || ''}
                  onChange={(e) => handleDataEdit(field.key, e.target.value)}
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidationDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveData} variant="contained">
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

