const request = require('supertest');
const express = require('express');
const db = require('../database');
const certificateTypeRoutes = require('../routes/certificateTypeRoutes');

// Mock middlewares
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id: 'admin1', role: 'admin' }; next(); },
  checkRole: (roles) => (req, res, next) => next(),
}));

// Mock DB
jest.mock('../database', () => ({
  execute: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/certificate-types', certificateTypeRoutes(db));

describe('Certificate Type Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/certificate-types', () => {
    test('should create a new certificate type', async () => {
      db.execute.mockResolvedValueOnce([{ insertId: 1 }]);
      
      const response = await request(app)
        .post('/api/certificate-types')
        .send({ name: 'New Type', fee: 50 });

      expect(response.status).toBe(201);
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO certificate_types'),
        expect.arrayContaining(['New Type', 50])
      );
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/certificate-types')
        .send({}); // Missing name

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/certificate-types/:id', () => {
    test('should update certificate type', async () => {
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/certificate-types/1')
        .send({ name: 'Updated Type', fee: 100 });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/certificate-types/:id', () => {
    test('should delete certificate type if unused', async () => {
      db.execute
        .mockResolvedValueOnce([[{ count: 0 }]]) // Dependency check
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete

      const response = await request(app).delete('/api/certificate-types/1');
      expect(response.status).toBe(200);
    });

    test('should block delete if used', async () => {
      db.execute.mockResolvedValueOnce([[{ count: 5 }]]); // Used in 5 certs

      const response = await request(app).delete('/api/certificate-types/1');
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Cannot delete/);
    });
  });
});
