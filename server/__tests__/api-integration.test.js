const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Mock routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'test') {
    const token = jwt.sign({ id: 1, role: 'admin' }, 'test-secret');
    return res.json({ token, user: { id: 1, username: 'admin', role: 'admin' } });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/residents', (req, res) => {
  res.json([{ Resident_ID: 1, First_Name: 'Juan', Last_Name: 'Dela Cruz' }]);
});

app.get('/api/certificates', (req, res) => {
  res.json([{ id: 1, certificate_type: 'Barangay Clearance', status: 'Released' }]);
});

describe('API Integration Tests', () => {
  describe('Authentication', () => {
    test('POST /api/auth/login - success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'test' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('admin');
    });

    test('POST /api/auth/login - invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Residents API', () => {
    test('GET /api/residents - returns list', async () => {
      const res = await request(app).get('/api/residents');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('Resident_ID');
    });
  });

  describe('Certificates API', () => {
    test('GET /api/certificates - returns list', async () => {
      const res = await request(app).get('/api/certificates');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
