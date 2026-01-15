const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

jest.mock('../database', () => mockDb);

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'RES-A', resident_id: 'RES-A', role: 12 };
    next();
  },
  checkRole: () => (req, res, next) => next(),
  enforceReadOnly: (req, res, next) => next()
}));

describe('resident document downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resident cannot list another resident documents', async () => {
    const residentRoutes = require('../routes/residentRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/residents', residentRoutes({}));

    const res = await request(app).get('/api/residents/RES-B/documents');
    expect(res.status).toBe(403);
  });

  test('resident can download own document within uploads root', async () => {
    const residentRoutes = require('../routes/residentRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/residents', residentRoutes({}));

    const documentsRoot = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(documentsRoot, { recursive: true });
    const filePath = path.join(documentsRoot, `test-${Date.now()}.pdf`);
    await fs.writeFile(filePath, Buffer.from('%PDF-1.4\n%test\n'));

    mockDb.execute.mockResolvedValueOnce([[{ resident_id: 'RES-A', file_path: filePath, file_name: 'test.pdf' }]]);

    const res = await request(app).get('/api/residents/RES-A/documents/1/download');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/inline/);

    await fs.unlink(filePath);
  });
});

