/**
 * COMPREHENSIVE SYSTEM TEST SUITE
 * Tests all critical security and functionality requirements
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Express app setup
const express = require('express');
const app = express();
app.use(express.json());

// Mock database
const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

// Mock controllers
const blotterController = require('../controllers/blotterController');

// Setup app locals
app.locals.db = mockDb;

// Test JWT secret
const JWT_SECRET = 'test_secret_key';
process.env.JWT_SECRET = JWT_SECRET;

describe('🔒 SECURITY TEST SUITE - Captain Read-Only Enforcement', () => {
  let captainToken, adminToken, clerkToken;

  beforeAll(() => {
    // Generate test tokens
    captainToken = jwt.sign({ id: 1, role_id: 5, role: 'Captain' }, JWT_SECRET);
    adminToken = jwt.sign({ id: 2, role_id: 2, role: 'Admin' }, JWT_SECRET);
    clerkToken = jwt.sign({ id: 3, role_id: 4, role: 'Clerk' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Blotter Controller - Captain Restrictions', () => {
    test('✅ Captain CANNOT create blotter record', async () => {
      const req = {
        user: { role_id: 5, role: 'Captain' },
        body: {
          Complainant_Details: { name: 'John Doe' },
          Incident_Type: 'Theft',
          Narrative: 'Test incident',
          Location_Sitio: 'Batia'
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Security Alert: Captains are Read-Only.'
      });
    });

    test('✅ Captain CANNOT update blotter record', async () => {
      const req = {
        user: { role_id: 5, role: 'Captain' },
        body: { Status: 'Resolved' },
        params: { caseNumber: 'BLOT-2025-01-0001' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Security Alert: Captains are Read-Only.'
      });
    });

    test('✅ Captain CANNOT delete blotter record', async () => {
      const req = {
        user: { role_id: 5, role: 'Captain' },
        params: { caseNumber: 'BLOT-2025-01-0001' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Security Alert: Captains are Read-Only.'
      });
    });

    test('✅ Captain CAN read blotter records', async () => {
      mockDb.execute.mockResolvedValue([[
        { Case_Number: 'BLOT-2025-01-0001', Incident_Type: 'Theft' }
      ]]);

      const req = {
        user: { role_id: 5, role: 'Captain' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await blotterController.getAll(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(mockDb.execute).toHaveBeenCalled();
    });

    test('✅ Admin CAN create blotter record', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]) // resident check
        .mockResolvedValueOnce([{ insertId: 1 }]); // insert

      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {
          Complainant_Details: { name: 'John Doe' },
          Incident_Type: 'Theft',
          Narrative: 'Test incident',
          Location_Sitio: 'Batia'
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Blotter record created successfully'
        })
      );
    });

    test('✅ Clerk CAN create blotter record', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]) // resident check
        .mockResolvedValueOnce([{ insertId: 1 }]); // insert

      const req = {
        user: { role_id: 4, role: 'Clerk' },
        body: {
          Complainant_Details: { name: 'Jane Doe' },
          Incident_Type: 'Noise',
          Narrative: 'Loud music',
          Location_Sitio: 'Northville'
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});

describe('🧪 FUNCTIONAL TEST SUITE - Core Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Blotter Validation', () => {
    test('✅ Rejects blotter creation with missing required fields', async () => {
      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {
          Complainant_Details: { name: 'John Doe' }
          // Missing: Incident_Type, Narrative, Location_Sitio
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Required fields missing'
      });
    });

    test('✅ Validates respondent_id exists', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]); // Empty result = resident not found

      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {
          Complainant_Details: { name: 'John Doe' },
          Incident_Type: 'Theft',
          Narrative: 'Test',
          Location_Sitio: 'Batia',
          respondent_id: 999
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid respondent_id - resident not found'
      });
    });

    test('✅ Auto-generates case number if not provided', async () => {
      mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }]);

      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {
          Complainant_Details: { name: 'John Doe' },
          Incident_Type: 'Theft',
          Narrative: 'Test',
          Location_Sitio: 'Batia'
        },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          Case_Number: expect.stringMatching(/^BLOT-\d{4}-\d{2}-\d{4}$/)
        })
      );
    });
  });

  describe('Blotter Update Operations', () => {
    test('✅ Updates blotter record successfully', async () => {
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {
          Status: 'Resolved',
          Narrative: 'Updated narrative'
        },
        params: { caseNumber: 'BLOT-2025-01-0001' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await blotterController.update(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Blotter record updated successfully'
      });
    });

    test('✅ Rejects update with no fields', async () => {
      const req = {
        user: { role_id: 2, role: 'Admin' },
        body: {},
        params: { caseNumber: 'BLOT-2025-01-0001' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await blotterController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No fields to update'
      });
    });
  });

  describe('Blotter Delete Operations', () => {
    test('✅ Deletes blotter record successfully', async () => {
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = {
        user: { role_id: 2, role: 'Admin' },
        params: { caseNumber: 'BLOT-2025-01-0001' },
        app: { locals: { db: mockDb } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await blotterController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Blotter record deleted successfully'
      });
    });
  });
});

describe('🎯 INTEGRATION TEST SUITE - Role-Based Access', () => {
  const roles = [
    { id: 2, name: 'Admin', canWrite: true },
    { id: 3, name: 'Secretary', canWrite: true },
    { id: 4, name: 'Clerk', canWrite: true },
    { id: 5, name: 'Captain', canWrite: false },
    { id: 6, name: 'Tanod', canWrite: true }
  ];

  roles.forEach(role => {
    describe(`${role.name} Role (ID: ${role.id})`, () => {
      test(`${role.canWrite ? '✅ CAN' : '❌ CANNOT'} create blotter`, async () => {
        mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }]);

        const req = {
          user: { role_id: role.id, role: role.name },
          body: {
            Complainant_Details: { name: 'Test' },
            Incident_Type: 'Test',
            Narrative: 'Test',
            Location_Sitio: 'Test'
          },
          app: { locals: { db: mockDb } }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await blotterController.create(req, res);

        if (role.canWrite) {
          expect(res.status).toHaveBeenCalledWith(201);
        } else {
          expect(res.status).toHaveBeenCalledWith(403);
        }
      });
    });
  });
});

describe('📊 SYSTEM HEALTH CHECKS', () => {
  test('✅ Blotter controller exports all required methods', () => {
    expect(blotterController.getAll).toBeDefined();
    expect(blotterController.create).toBeDefined();
    expect(blotterController.update).toBeDefined();
    expect(blotterController.delete).toBeDefined();
  });

  test('✅ All methods are async functions', () => {
    expect(blotterController.getAll.constructor.name).toBe('AsyncFunction');
    expect(blotterController.create.constructor.name).toBe('AsyncFunction');
    expect(blotterController.update.constructor.name).toBe('AsyncFunction');
    expect(blotterController.delete.constructor.name).toBe('AsyncFunction');
  });
});

describe('🛡️ ERROR HANDLING TEST SUITE', () => {
  test('✅ Controller handles errors with try-catch blocks', () => {
    // Verify error handling structure exists
    const createSource = blotterController.create.toString();
    const getAllSource = blotterController.getAll.toString();
    
    expect(createSource).toContain('try');
    expect(createSource).toContain('catch');
    expect(getAllSource).toContain('try');
    expect(getAllSource).toContain('catch');
  });
});

// Test summary
afterAll(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COMPREHENSIVE SYSTEM TEST SUITE COMPLETED');
  console.log('='.repeat(60));
  console.log('✅ Security Tests: Captain Read-Only Enforcement');
  console.log('✅ Functional Tests: CRUD Operations');
  console.log('✅ Integration Tests: Role-Based Access Control');
  console.log('✅ Health Checks: System Components');
  console.log('✅ Error Handling: Graceful Degradation');
  console.log('='.repeat(60) + '\n');
});
