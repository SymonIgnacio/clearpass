const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Get all residents
app.get('/api/residents', async (req, res) => {
  try {
    const residents = await db.getResidents();
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Get all blotter records
app.get('/api/blotter', async (req, res) => {
  try {
    const blotterRecords = await db.getBlotterRecords();
    res.json(blotterRecords);
  } catch (error) {
    console.error('Error fetching blotter records:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});

// Get all certificate types
app.get('/api/certificate-types', async (req, res) => {
  try {
    const certificateTypes = await db.getCertificateTypes();
    res.json(certificateTypes);
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({ error: 'Failed to fetch certificate types' });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await db.getCertificates();
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Check blotter status for resident
app.get('/api/residents/:id/blotter-status', async (req, res) => {
  try {
    const hasActiveBlotter = await db.checkBlotterStatus(req.params.id);
    res.json({ hasActiveBlotter });
  } catch (error) {
    console.error('Error checking blotter status:', error);
    res.status(500).json({ error: 'Failed to check blotter status' });
  }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Create a new certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const newCertificate = await db.createCertificate(req.body);
    res.status(201).json(newCertificate);
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

app.listen(port, () => {
  console.log(`Barangay Management Server listening at http://localhost:${port}`);
  console.log('Database: barangay_batia');
  console.log('Available endpoints:');
  console.log('- GET /api/residents');
  console.log('- GET /api/blotter');
  console.log('- GET /api/certificate-types');
  console.log('- GET /api/certificates');
  console.log('- POST /api/certificates');
  console.log('- GET /api/dashboard/stats');
});
