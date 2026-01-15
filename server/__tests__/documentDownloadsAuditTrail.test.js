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
  verifyRole: () => (req, res, next) => next(),
  enforceReadOnly: (req, res, next) => next()
}));

describe('audit trail for document downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resident document download inserts audit_logs entry', async () => {
    const residentRoutes = require('../routes/residentRoutes');
    const app = express();
    app.locals.db = mockDb;
    app.use(express.json());
    app.use('/api/residents', residentRoutes({}));

    const documentsRoot = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(documentsRoot, { recursive: true });
    const filePath = path.join(documentsRoot, `audit-${Date.now()}.pdf`);
    await fs.writeFile(filePath, Buffer.from('%PDF-1.4\n%audit\n'));

    const auditEvents = [];
    mockDb.execute.mockImplementation(async (sql, params) => {
      const q = String(sql).toLowerCase();
      if (q.includes('from resident_documents')) {
        return [[{ resident_id: 'RES-A', file_path: filePath, file_name: 'x.pdf', encryption_alg: null, encryption_iv: null, encryption_tag: null }]];
      }
      if (q.includes('insert into audit_logs')) {
        auditEvents.push(params[0]);
        return [{ affectedRows: 1 }];
      }
      return [[]];
    });

    const res = await request(app).get('/api/residents/RES-A/documents/1/download');
    expect(res.status).toBe(200);
    await new Promise(setImmediate);
    expect(auditEvents).toContain('RESIDENT_DOCUMENT_DOWNLOADED');

    await fs.unlink(filePath);
  });

  test('secretary application document download inserts audit_logs entry', async () => {
    const secretaryRoutes = require('../routes/secretaryRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/secretary', secretaryRoutes(mockDb));

    const documentsRoot = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(documentsRoot, { recursive: true });
    const filePath = path.join(documentsRoot, `auditapp-${Date.now()}.pdf`);
    await fs.writeFile(filePath, Buffer.from('%PDF-1.4\n%auditapp\n'));

    const auditEvents = [];
    mockDb.execute.mockImplementation(async (sql, params) => {
      const q = String(sql).toLowerCase();
      if (q.includes('from application_documents')) {
        return [[{ file_path: filePath, file_name: 'a.pdf', encryption_alg: null, encryption_iv: null, encryption_tag: null }]];
      }
      if (q.includes('insert into audit_logs')) {
        auditEvents.push(params[0]);
        return [{ affectedRows: 1 }];
      }
      return [[]];
    });

    const res = await request(app).get('/api/secretary/applications/APP-1/documents/1/download');
    expect(res.status).toBe(200);
    await new Promise(setImmediate);
    expect(auditEvents).toContain('APPLICATION_DOCUMENT_DOWNLOADED');

    await fs.unlink(filePath);
  });
});

