const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ROLES } = require('../config/roles');

const JWT_SECRET = 'sensitive-route-mfa-test-secret-32-chars';

const tokenForRole = (role, mfaVerified = false) =>
  jwt.sign({ id: `user-${role}`, role, mfa_verified: mfaVerified }, JWT_SECRET, { expiresIn: '5m' });

const withMfaEnv = () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';
  process.env.MFA_ENFORCE_VERIFICATION = 'true';
};

describe('sensitive route MFA enforcement', () => {
  beforeEach(() => {
    jest.resetModules();
    withMfaEnv();
  });

  test.each([
    ['admin staff creation', '/api/admin/staff', 'post'],
    ['admin role creation', '/api/admin/roles', 'post'],
    ['resident verification', '/api/admin/verify-resident/123', 'post'],
  ])('blocks pending-MFA admin tokens for %s', async (_label, path, method) => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', require('../routes/adminRoutes')({ execute: jest.fn() }));

    const response = await request(app)
      [method](path)
      .set('Authorization', `Bearer ${tokenForRole(ROLES.ADMIN)}`)
      .send({});

    expect(response.status).toBe(428);
    expect(response.body).toMatchObject({ error: 'MFA required' });
  });

  test('blocks pending-MFA admin tokens for security log export', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', require('../routes/adminRoutes')({ execute: jest.fn() }));

    const response = await request(app)
      .get('/api/admin/logs/export')
      .set('Authorization', `Bearer ${tokenForRole(ROLES.ADMIN)}`);

    expect(response.status).toBe(428);
    expect(response.body).toMatchObject({ error: 'MFA required' });
  });

  test.each([
    ['backup', '/api/system-admin/backup', 'post', ROLES.ADMIN],
    ['settings update', '/api/system-admin/settings', 'put', ROLES.SECRETARY],
    ['settings reset', '/api/system-admin/reset-settings', 'post', ROLES.ADMIN],
    ['system settings update', '/api/system-admin/system-settings', 'put', ROLES.SECRETARY],
  ])('blocks pending-MFA tokens for system admin %s', async (_label, path, method, role) => {
    const app = express();
    app.use(express.json());
    app.use('/api/system-admin', require('../routes/systemAdminRoutes')({ execute: jest.fn() }));

    const response = await request(app)
      [method](path)
      .set('Authorization', `Bearer ${tokenForRole(role)}`)
      .send({});

    expect(response.status).toBe(428);
    expect(response.body).toMatchObject({ error: 'MFA required' });
  });

  test('blocks pending-MFA staff tokens for document request approval changes', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/documents', require('../routes/documentRoutes')({ execute: jest.fn() }));

    const response = await request(app)
      .put('/api/documents/requests/REQ-1')
      .set('Authorization', `Bearer ${tokenForRole(ROLES.CLERK)}`)
      .send({ status: 'approved' });

    expect(response.status).toBe(428);
    expect(response.body).toMatchObject({ error: 'MFA required' });
  });

  test('blocks pending-MFA staff tokens for certificate request status changes', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/certificate-requests', require('../routes/certificateRequestRoutes')({ execute: jest.fn() }));

    const response = await request(app)
      .put('/api/certificate-requests/REQ-1/status')
      .set('Authorization', `Bearer ${tokenForRole(ROLES.SECRETARY)}`)
      .send({ status: 'approved' });

    expect(response.status).toBe(428);
    expect(response.body).toMatchObject({ error: 'MFA required' });
  });
});
