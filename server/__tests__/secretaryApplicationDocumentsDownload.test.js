const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'SEC-1', role: 3 };
    next();
  },
  checkRole: () => (req, res, next) => next(),
}));

describe('secretary application document downloads', () => {
  test('downloads application document from uploads root', async () => {
    const secretaryRoutes = require('../routes/secretaryRoutes');

    const documentsRoot = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(documentsRoot, { recursive: true });
    const filePath = path.join(documentsRoot, `appdoc-${Date.now()}.pdf`);
    await fs.writeFile(filePath, Buffer.from('%PDF-1.4\n%app\n'));

    const mockDb = {
      execute: jest.fn(async sql => {
        const q = String(sql).toLowerCase();
        if (q.includes('from application_documents')) {
          return [[{ file_path: filePath, file_name: 'app.pdf' }]];
        }
        return [[]];
      }),
      getConnection: jest.fn(),
    };

    const app = express();
    app.use(express.json());
    app.use('/api/secretary', secretaryRoutes(mockDb));

    const res = await request(app).get('/api/secretary/applications/APP-1/documents/1/download');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/inline/);

    await fs.unlink(filePath);
  });
});
