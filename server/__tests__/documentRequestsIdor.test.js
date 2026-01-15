const express = require('express');
const request = require('supertest');

const mockDb = {
  execute: jest.fn()
};

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'RES-A', resident_id: 'RES-A', role: 12 };
    next();
  },
  checkRole: () => (req, res, next) => next()
}));

describe('document requests IDOR protections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST ignores body resident_id and uses token resident_id', async () => {
    const documentRoutes = require('../routes/documentRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/documents', documentRoutes(mockDb));

    mockDb.execute
      .mockResolvedValueOnce([[{ Resident_ID: 'RES-A', First_Name: 'A', Last_Name: 'User' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/documents/requests')
      .send({ resident_id: 'RES-B', document_type: 'Barangay Clearance', purpose: 'Test' });

    expect(res.status).toBe(201);
    expect(mockDb.execute).toHaveBeenCalledTimes(2);
    expect(mockDb.execute.mock.calls[0][0]).toMatch(/FROM residents WHERE Resident_ID = \?/);
    expect(mockDb.execute.mock.calls[0][1]).toEqual(['RES-A']);
    expect(mockDb.execute.mock.calls[1][1][1]).toBe('RES-A');
  });

  test('GET for resident scopes results to token resident_id', async () => {
    const documentRoutes = require('../routes/documentRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/documents', documentRoutes(mockDb));

    mockDb.execute.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/documents/requests');

    expect(res.status).toBe(200);
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
    expect(mockDb.execute.mock.calls[0][0]).toMatch(/WHERE dr\.resident_id = \?/);
    expect(mockDb.execute.mock.calls[0][1]).toEqual(['RES-A']);
  });
});

