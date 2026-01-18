const request = require('supertest');
const express = require('express');
const secretaryRoutes = require('../../server/routes/secretaryRoutes');

// Mock Auth Middleware
jest.mock('../../server/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, role: 'secretary' };
    next();
  },
  checkRole: (roles) => (req, res, next) => next()
}));

// Mock MFA Middleware
jest.mock('../../server/middleware/mfaMiddleware', () => ({
  requireMfaForRoles: (roles) => (req, res, next) => next()
}));

// Mock Audit Logger
jest.mock('../../server/middleware/auditLogger', () => ({
  logAuditEvent: jest.fn(),
  logAuditToDatabase: jest.fn(),
  AUDIT_EVENTS: {
    APPLICATION_APPROVED: 'APPLICATION_APPROVED',
    APPLICATION_REJECTED: 'APPLICATION_REJECTED'
  }
}));

const { logAuditEvent } = require('../../server/middleware/auditLogger');

describe('Registration Workflow Tests', () => {
  let app;
  let mockDb;
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn().mockResolvedValue([[]]) // Default return
    };

    mockDb = {
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    app = express();
    app.use(express.json());
    app.use('/api/secretary', secretaryRoutes(mockDb));
  });

  describe('POST /applications/:id/approve', () => {
    const validApplication = {
      application_id: 'APP-001',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      birthdate: '1980-01-01', // 44 years old (Not Senior)
      gender: 'Male',
      civil_status: 'Married',
      sitio: 'Batia Proper',
      street_address: 'Block 1 Lot 2',
      email: 'juan@example.com',
      mobile_number: '09123456789',
      is_4ps: 1,
      is_pwd: 0,
      is_solo_parent: 0,
      is_out_of_school_youth: 0,
      disability_type: null
    };

    test('should approve valid application and create resident', async () => {
      // Mock finding application
      mockConnection.execute
        .mockResolvedValueOnce([[validApplication]]) // Select application
        .mockResolvedValueOnce([[]]) // Check existing user (empty)
        .mockResolvedValueOnce([[{ id: 1 }]]) // Resolve Sitio ID
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert Household
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert Resident
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert Vulnerabilities
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert User
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update Application Status

      const response = await request(app)
        .post('/api/secretary/applications/APP-001/approve');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Application approved');
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith('APPLICATION_APPROVED', expect.anything());
      
      // Find the vulnerability insert call
      const vulnInsertCall = mockConnection.execute.mock.calls.find(call => 
        call[0].includes('INSERT INTO vulnerabilities')
      );
      
      expect(vulnInsertCall).toBeDefined();
      expect(vulnInsertCall[1][7]).toBe(1); // Score
    });

    test('should calculate Senior Citizen status correctly', async () => {
      const seniorApp = { ...validApplication, birthdate: '1950-01-01' }; // 70+ years old

      mockConnection.execute
        .mockResolvedValueOnce([[seniorApp]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      await request(app).post('/api/secretary/applications/APP-001/approve');

      const vulnInsertCall = mockConnection.execute.mock.calls.find(call => 
        call[0].includes('INSERT INTO vulnerabilities')
      );
      
      expect(vulnInsertCall).toBeDefined();
      expect(vulnInsertCall[1][7]).toBe(2); 
      expect(vulnInsertCall[1][3]).toBe(true); // Is_Senior
    });

    test('should fail validation if missing required fields', async () => {
      const invalidApp = { ...validApplication, first_name: null }; // Missing Name

      // Reset default to ensure we don't get 404 from default [[]]
      mockConnection.execute.mockReset(); 
      mockConnection.execute.mockResolvedValueOnce([[invalidApp]]);

      const response = await request(app)
        .post('/api/secretary/applications/APP-001/approve');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    test('should rollback if email already exists', async () => {
      mockConnection.execute.mockReset();
      mockConnection.execute
        .mockResolvedValueOnce([[validApplication]])
        .mockResolvedValueOnce([[{ id: 5 }]]); // Existing user found

      const response = await request(app)
        .post('/api/secretary/applications/APP-001/approve');

      expect(response.status).toBe(409);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('POST /applications/:id/reject', () => {
    test('should reject application and log audit', async () => {
      mockConnection.execute.mockReset();
      mockConnection.execute
        .mockResolvedValueOnce([[{ application_id: 'APP-001' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .post('/api/secretary/applications/APP-001/reject')
        .send({ reason: 'Incomplete docs' });

      expect(response.status).toBe(200);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith('APPLICATION_REJECTED', expect.anything());
    });
  });
});
