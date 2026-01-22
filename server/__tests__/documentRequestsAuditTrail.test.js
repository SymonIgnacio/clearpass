const express = require('express');
const request = require('supertest');

const { auditMiddleware } = require('../middleware/auditLogger');
const documentRoutes = require('../routes/documentRoutes');
const adminRoutes = require('../routes/adminRoutes');

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const role = Number.parseInt(req.header('x-test-role') || '12', 10);
    const id = req.header('x-test-user') || (role === 1 ? 'ADMIN-1' : 'RES-A');
    req.user = { id, resident_id: id, role };
    next();
  },
  checkRole: () => (req, res, next) => next(),
  verifyRole: allowedRoles => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  },
}));

describe('audit trail for document requests', () => {
  test('POST/GET /documents/requests are persisted to audit_logs and visible in /admin/logs', async () => {
    const auditLogs = [];

    const mockDb = {
      execute: jest.fn(async (sql, params) => {
        const q = String(sql).toLowerCase();
        if (q.includes('insert into audit_logs')) {
          auditLogs.push({
            event_type: params[0],
            user_id: params[1],
            user_role: params[2],
            resource: params[5],
            action: params[6],
            result: params[7],
          });
          return [{ affectedRows: 1 }];
        }
        if (q.includes('select count(*) as total from audit_logs')) {
          return [[{ total: auditLogs.length }]];
        }
        if (q.includes('select * from audit_logs')) {
          return [auditLogs];
        }
        if (q.includes('from residents where resident_id')) {
          return [[{ Resident_ID: 'RES-A', First_Name: 'A', Last_Name: 'User' }]];
        }
        if (q.includes('insert into document_requests')) {
          return [{ affectedRows: 1 }];
        }
        if (q.includes('from document_requests')) {
          return [[]];
        }
        return [[]];
      }),
    };

    const app = express();
    app.locals.db = mockDb;
    app.use(express.json());
    app.use(auditMiddleware({ auditAll: false }));
    app.use('/api/documents', documentRoutes(mockDb));
    app.use('/api/admin', adminRoutes(mockDb));

    const postRes = await request(app)
      .post('/api/documents/requests')
      .set('x-test-role', '12')
      .set('x-test-user', 'RES-A')
      .send({ document_type: 'Barangay Clearance', purpose: 'Test' });
    expect(postRes.status).toBe(201);

    await new Promise(setImmediate);

    const getRes = await request(app)
      .get('/api/documents/requests')
      .set('x-test-role', '12')
      .set('x-test-user', 'RES-A');
    expect(getRes.status).toBe(200);

    await new Promise(setImmediate);

    const logsRes = await request(app)
      .get('/api/admin/logs?page=1&limit=100')
      .set('x-test-role', '1')
      .set('x-test-user', 'ADMIN-1');
    expect(logsRes.status).toBe(200);
    expect(logsRes.body.success).toBe(true);

    const eventTypes = (logsRes.body.logs || []).map(l => l.event_type);
    expect(eventTypes).toContain('DOCUMENT_REQUEST_CREATED');
    expect(eventTypes).toContain('DOCUMENT_REQUEST_VIEWED');
  });
});
