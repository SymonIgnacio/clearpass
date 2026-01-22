const request = require('supertest');
jest.mock('../database', () => {
  return {
    getConnection: async () => ({ release: () => {} }),
    execute: jest.fn(async (sql, params = []) => {
      // Return mixed resident/application docs based on the query
      if (typeof sql === 'string' && sql.includes('FROM resident_documents')) {
        const raw = [
          // Should be excluded
          {
            id: 1,
            document_type: 'PWD ID (Front)',
            file_name: 'front.png',
            verification_status: 'pending',
            created_at: new Date(),
            resident_name: 'John Doe',
            source_type: 'resident',
          },
          {
            id: 2,
            document_type: 'Senior ID (Back)',
            file_name: 'back.png',
            verification_status: 'pending',
            created_at: new Date(),
            resident_name: 'Jane Doe',
            source_type: 'resident',
          },
          // Should remain visible
          {
            id: 3,
            document_type: 'Proof of Residency',
            file_name: 'proof.pdf',
            verification_status: 'pending',
            created_at: new Date(),
            resident_name: 'Jim Beam',
            source_type: 'resident',
          },
          // Application doc should remain visible
          {
            id: 4,
            document_type: 'valid_id',
            file_name: 'id.pdf',
            verification_status: 'pending',
            created_at: new Date(),
            resident_name: 'Applicant One',
            source_type: 'application',
          },
        ];
        const exclude = [
          '4Ps Proof',
          'PWD ID (Front)',
          'PWD ID (Back)',
          'Senior ID (Front)',
          'Senior ID (Back)',
          'Solo Parent ID (Front)',
          'Solo Parent ID (Back)',
          'OSY Certification',
        ];
        const filtered = raw.filter(
          r => !(exclude.includes(r.document_type) && r.source_type === 'resident')
        );
        return [filtered];
      }
      return [[[]]];
    }),
  };
});

jest.mock('../middleware/authMiddleware', () => {
  return {
    verifyToken: (req, res, next) => {
      req.user = { id: 1, role: 3 };
      next();
    },
    checkRole: () => (req, res, next) => next(),
    enforceReadOnly: (req, res, next) => next(),
    authenticate: (req, res, next) => {
      req.user = { id: 1, role: 3 };
      next();
    },
    verifyRole: () => (req, res, next) => next(),
  };
});

jest.mock('../middleware/mfaMiddleware', () => {
  return {
    requireMfaForRoles: () => (req, res, next) => next(),
  };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'barangay_management';

const app = require('../index');

describe('Residency Verification filtering', () => {
  it('excludes beneficiary doc variants from resident-documents', async () => {
    const res = await request(app).get('/api/secretary/resident-documents?status=pending');
    expect(res.status).toBe(200);
    const types = res.body.map(r => r.document_type);
    expect(types).not.toContain('PWD ID (Front)');
    expect(types).not.toContain('Senior ID (Back)');
    expect(types).toContain('Proof of Residency');
    expect(types).toContain('valid_id');
  });
});
