const jwt = require('jsonwebtoken');

describe('authMiddleware verifyToken normalization', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('normalizes role_id into numeric role and sets resident_id for residents', () => {
    const { verifyToken } = require('../middleware/authMiddleware');

    const token = jwt.sign(
      { id: 'RES-TEST-1', role_id: '12', type: 'resident' },
      process.env.JWT_SECRET
    );

    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe(12);
    expect(req.user.resident_id).toBe('RES-TEST-1');
  });
});
