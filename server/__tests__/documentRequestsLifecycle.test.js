const express = require('express');
const request = require('supertest');

const { ROLES } = require('../config/roles');

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const role = Number.parseInt(req.header('x-test-role') || '12', 10);
    const id = req.header('x-test-user') || (role === 1 ? 'ADMIN-1' : 'RES-A');
    req.user = { id, resident_id: id, role };
    next();
  },
  checkRole: allowedRoles => (req, res, next) => {
    const { ROLES: ROLE_CONST } = require('../config/roles');
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRole = req.user.role;
    const normalized = allowedRoles.map(r => (typeof r === 'string' ? r.toLowerCase() : r));
    if (normalized.includes(userRole) || normalized.includes(String(userRole))) return next();
    if (normalized.includes('admin') && userRole === ROLE_CONST.ADMIN) return next();
    if (normalized.includes('secretary') && userRole === ROLE_CONST.SECRETARY) return next();
    if (normalized.includes('clerk') && userRole === ROLE_CONST.CLERK) return next();
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  },
}));

describe('document requests lifecycle', () => {
  test('resident can create and list only their requests; cannot update', async () => {
    jest.resetModules();
    const documentRoutes = require('../routes/documentRoutes');
    const calls = [];
    const mockDb = {
      execute: jest.fn(async (sql, params) => {
        calls.push({ sql: String(sql), params });
        const q = String(sql).toLowerCase();
        if (q.includes('select * from residents where resident_id')) {
          return [[{ Resident_ID: params[0], First_Name: 'A', Last_Name: 'User' }]];
        }
        if (q.includes('insert into document_requests')) {
          return [{ affectedRows: 1 }];
        }
        if (q.includes('from document_requests dr') && q.includes('where dr.resident_id')) {
          return [[[{ request_id: 'REQ-1', resident_id: params[0] }]]];
        }
        if (q.includes('update document_requests')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      }),
    };

    const app = express();
    app.use(express.json());
    app.use('/api/documents', documentRoutes(mockDb));

    const createRes = await request(app)
      .post('/api/documents/requests')
      .set('x-test-role', String(ROLES.RESIDENT))
      .set('x-test-user', 'RES-A')
      .send({ document_type: 'Barangay Clearance', purpose: 'Test', resident_id: 'RES-B' });
    expect(createRes.status).toBe(201);

    const listRes = await request(app)
      .get('/api/documents/requests')
      .set('x-test-role', String(ROLES.RESIDENT))
      .set('x-test-user', 'RES-A');
    expect(listRes.status).toBe(200);

    const listCall = calls.find(c => c.sql.toLowerCase().includes('from document_requests dr'));
    expect(listCall.params).toEqual(['RES-A']);

    const updateRes = await request(app)
      .put('/api/documents/requests/REQ-1')
      .set('x-test-role', String(ROLES.RESIDENT))
      .set('x-test-user', 'RES-A')
      .send({ status: 'approved' });
    expect(updateRes.status).toBe(403);
  });

  test('staff can list all requests and update status', async () => {
    jest.resetModules();
    const documentRoutes = require('../routes/documentRoutes');
    const calls = [];
    const mockDb = {
      execute: jest.fn(async (sql, params) => {
        calls.push({ sql: String(sql), params });
        const q = String(sql).toLowerCase();
        if (q.includes('from document_requests dr') && !q.includes('where dr.resident_id')) {
          return [[[{ request_id: 'REQ-1', resident_id: 'RES-A' }]]];
        }
        if (q.includes('update document_requests')) {
          return [{ affectedRows: 1 }];
        }
        return [[]];
      }),
    };

    const app = express();
    app.use(express.json());
    app.use('/api/documents', documentRoutes(mockDb));

    const listRes = await request(app)
      .get('/api/documents/requests')
      .set('x-test-role', String(ROLES.SECRETARY))
      .set('x-test-user', 'SEC-1');
    expect(listRes.status).toBe(200);

    expect(calls[0].params || []).toEqual([]);

    const updateRes = await request(app)
      .put('/api/documents/requests/REQ-1')
      .set('x-test-role', String(ROLES.SECRETARY))
      .set('x-test-user', 'SEC-1')
      .send({ status: 'approved', notes: 'ok' });
    expect(updateRes.status).toBe(200);
  });
});
