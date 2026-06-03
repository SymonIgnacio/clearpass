const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const mockDb = {
  execute: jest.fn()
};

jest.mock('../database', () => mockDb);

jest.mock('../utils/mfaOtp', () => ({
  createOtpChallenge: jest.fn(async () => ({ otp: '123456', expiresMinutes: 10, challengeId: 1 })),
  verifyOtpChallenge: jest.fn(async ({ otp }) =>
    otp === '123456' ? { ok: true, challengeId: 1 } : { ok: false, reason: 'invalid' }
  ),
  sendOtpEmail: jest.fn(async () => {})
}));

describe('OTP MFA flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.MFA_ENFORCE_VERIFICATION = 'true';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.MFA_ENFORCE_VERIFICATION;
  });

  test('login requires OTP and verify upgrades token to mfa_verified=true', async () => {
    const authController = require('../controllers/authController');
    const { verifyToken } = require('../middleware/authMiddleware');

    const password_hash = await bcrypt.hash('pass', 10);

    mockDb.execute.mockImplementation(async (sql, params) => {
      const q = String(sql).toLowerCase();
      if (q.includes('from users u') && q.includes('where u.username')) {
        return [
          [
            {
              id: 10,
              username: params[0],
              password_hash,
              role: 12,
              role_name: 'Resident',
              email: 'res@example.com',
              full_name: 'Res User',
              is_active: 1
            }
          ]
        ];
      }
      if (q.includes('from users u') && q.includes('where u.id')) {
        return [
          [
            {
              id: 10,
              username: 'resident',
              role: 12,
              role_name: 'Resident',
              email: 'res@example.com',
              full_name: 'Res User',
              is_active: 1
            }
          ]
        ];
      }
      return [[]];
    });

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/mfa/verify', verifyToken, authController.verifyMfaOtpCode);
    app.get('/api/auth/me', verifyToken, authController.me);

    const agent = request.agent(app);

    const loginRes = await agent.post('/api/auth/login').send({ username: 'resident', password: 'pass' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.mfa_required).toBe(true);
    expect(loginRes.body.user.mfa_verified).toBe(false);

    const verifyRes = await agent
      .post('/api/auth/mfa/verify')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ otp: '123456' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.mfa_verified).toBe(true);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.mfa_verified).toBe(true);
  });
});

