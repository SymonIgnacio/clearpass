const request = require('supertest');
jest.mock('../database', () => {
  return {
    getConnection: async () => ({ release: () => {} }),
    execute: jest.fn(async (sql, params = []) => {
      if (typeof sql === 'string' && sql.includes('FROM users')) {
        // Return a user record by id/resident_id
        if (params && params.length && params[0] === 9999)
          return [[{ email_verified: true, phone_verified: false }]];
        return [[]];
      }
      if (typeof sql === 'string' && sql.includes('FROM vulnerabilities')) {
        return [[{ Resident_ID: params[0] }]];
      }
      if (typeof sql === 'string' && sql.includes('INSERT INTO resident_documents')) {
        return [[{ affectedRows: 1 }]];
      }
      return [[{}]];
    }),
  };
});

jest.mock('../middleware/authMiddleware', () => {
  const { ROLES } = require('../config/roles');
  return {
    verifyToken: (req, res, next) => {
      req.user = {
        id: 9999,
        role: ROLES.RESIDENT,
        resident_id: req.headers['x-test-resident-id']
          ? Number(req.headers['x-test-resident-id'])
          : undefined,
      };
      next();
    },
    checkRole: () => (req, res, next) => next(),
    ROLES: require('../config/roles').ROLES,
  };
});

// Ensure required env variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'barangay_management';

const app = require('../index');

describe('Resident Profile API', () => {
  it('returns 403 for beneficiary update when resident_id missing', async () => {
    const res = await request(app)
      .put('/api/resident-profile/beneficiary-status')
      .field('Is_4Ps', 'false')
      .field('Is_PWD', 'false')
      .field('Is_Senior', 'false')
      .field('Is_Solo_Parent', 'false')
      .field('Is_Out_of_School_Youth', 'false');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when PWD selected without front/back uploads', async () => {
    const res = await request(app)
      .put('/api/resident-profile/beneficiary-status')
      .set('x-test-resident-id', '123')
      .field('Is_PWD', 'true')
      .field('Disability_Type', 'Orthopedic');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('verification status returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/resident-profile/verification-status');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
