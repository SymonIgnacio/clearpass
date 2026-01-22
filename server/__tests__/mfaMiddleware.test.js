const express = require('express');
const request = require('supertest');

const { requireMfaForRoles } = require('../middleware/mfaMiddleware');
const { ROLES } = require('../config/roles');

describe('MFA middleware', () => {
  beforeEach(() => {
    delete process.env.MFA_ENFORCE_VERIFICATION;
  });

  test('does not block when MFA enforcement is disabled', async () => {
    const app = express();
    app.get(
      '/secure',
      (req, res, next) => {
        req.user = { id: 'U1', role: ROLES.ADMIN };
        next();
      },
      requireMfaForRoles([ROLES.ADMIN]),
      (req, res) => res.json({ ok: true })
    );

    const res = await request(app).get('/secure');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('blocks admin when MFA enforcement enabled and not verified', async () => {
    process.env.MFA_ENFORCE_VERIFICATION = 'true';
    const app = express();
    app.get(
      '/secure',
      (req, res, next) => {
        req.user = { id: 'U1', role: ROLES.ADMIN, mfa_verified: false };
        next();
      },
      requireMfaForRoles([ROLES.ADMIN]),
      (req, res) => res.json({ ok: true })
    );

    const res = await request(app).get('/secure');
    expect(res.status).toBe(428);
  });

  test('allows admin when MFA enforcement enabled and verified', async () => {
    process.env.MFA_ENFORCE_VERIFICATION = 'true';
    const app = express();
    app.get(
      '/secure',
      (req, res, next) => {
        req.user = { id: 'U1', role: ROLES.ADMIN, mfa_verified: true };
        next();
      },
      requireMfaForRoles([ROLES.ADMIN]),
      (req, res) => res.json({ ok: true })
    );

    const res = await request(app).get('/secure');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
