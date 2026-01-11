const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

describe('RBAC smoke via signed JWT', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  const sign = (role, id = 'U-1') => {
    return jwt.sign({ id, username: 'test', role, role_name: 'test', mfa_verified: true }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  };

  const makeApp = () => {
    const app = express();
    app.use(express.json());
    app.get('/admin-only', verifyToken, checkRole([ROLES.ADMIN]), (req, res) => res.json({ ok: true }));
    app.get(
      '/staff',
      verifyToken,
      checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
      (req, res) => res.json({ ok: true })
    );
    app.get('/resident-only', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => res.json({ ok: true }));
    app.post('/officer-only', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => res.json({ ok: true }));
    return app;
  };

  test('admin-only endpoint allows admin and denies others', async () => {
    const app = makeApp();
    const ok = await request(app).get('/admin-only').set('Authorization', `Bearer ${sign(ROLES.ADMIN)}`);
    expect(ok.status).toBe(200);
    const denied = await request(app).get('/admin-only').set('Authorization', `Bearer ${sign(ROLES.RESIDENT)}`);
    expect(denied.status).toBe(403);
  });

  test('staff endpoint denies residents', async () => {
    const app = makeApp();
    const staffOk = await request(app).get('/staff').set('Authorization', `Bearer ${sign(ROLES.SECRETARY)}`);
    expect(staffOk.status).toBe(200);
    const residentDenied = await request(app).get('/staff').set('Authorization', `Bearer ${sign(ROLES.RESIDENT)}`);
    expect(residentDenied.status).toBe(403);
  });

  test('officer-only endpoint allows blotter officer only', async () => {
    const app = makeApp();
    const ok = await request(app).post('/officer-only').set('Authorization', `Bearer ${sign(ROLES.BLOTTER_OFFICER)}`);
    expect(ok.status).toBe(200);
    const denied = await request(app).post('/officer-only').set('Authorization', `Bearer ${sign(ROLES.CLERK)}`);
    expect(denied.status).toBe(403);
  });
});

