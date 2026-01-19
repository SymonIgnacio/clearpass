const request = require('supertest');

// Mock objects
const mockBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  first: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  whereNot: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  // Default implementation for await: resolve with empty array
  then: jest.fn((resolve) => resolve([]))
};

const mockKnex = jest.fn(() => mockBuilder);
mockKnex.raw = jest.fn();
mockKnex.fn = { now: jest.fn() };

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Mock knex
jest.mock('knex', () => () => mockKnex);
jest.mock('../knexfile', () => ({ development: {} }));

describe('Admin Controller Hierarchy Tests (Knex)', () => {
  let adminController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the "then" implementation to default
    mockBuilder.then.mockImplementation((resolve) => resolve([]));
    
    jest.isolateModules(() => {
        adminController = require('../controllers/adminController');
    });
  });
  
  // Helper to mock the next query result
  const mockNextResult = (result) => {
    mockBuilder.then.mockImplementationOnce((resolve) => resolve(result));
  };

  describe('createStaff Hierarchy Enforcement', () => {
    it('should BLOCK a lower-level officer (Level 2) from creating a higher-level admin (Level 1)', async () => {
      // Logic:
      // 1. getRoleLevel(req.user.role) -> select...where... -> returns [{hierarchy_level: 2}]
      // 2. getRoleLevel(roleNum) -> select...where... -> returns [{hierarchy_level: 1}]
      
      // Mock result 1 (Requester)
      mockNextResult([{ hierarchy_level: 2 }]);
      // Mock result 2 (Target)
      mockNextResult([{ hierarchy_level: 1 }]);
      
      const req = {
        user: { role: 2 }, // Captain
        body: {
          username: 'newadmin',
          role_id: 1, // Admin
          password: 'password123'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await adminController.createStaff(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Access denied')
      }));
    });

    it('should ALLOW an Admin (Level 1) to create another Admin (Level 1)', async () => {
        // 1. Requester Level
        mockNextResult([{ hierarchy_level: 1 }]);
        // 2. Target Level
        mockNextResult([{ hierarchy_level: 1 }]);
        // 3. Insert Result
        mockNextResult([123]); // Knex insert returns [id]
        
        const req = {
          user: { role: 1 },
          body: {
            username: 'newadmin2',
            role_id: 1,
            password: 'password123'
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        await adminController.createStaff(req, res);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Staff created successfully'
        }));
        
        // Verify Knex calls
        expect(mockKnex).toHaveBeenCalledWith('users');
        expect(mockBuilder.insert).toHaveBeenCalled();
    });
  });

  describe('updateStaff Hierarchy Enforcement', () => {
      it('should BLOCK editing a user with higher authority', async () => {
        // 1. Requester Level (Level 3)
        mockNextResult([{ hierarchy_level: 3 }]);
        // 2. Target User Lookup (has Role 1) - using .first()
        mockNextResult({ role: 1 });
        // 3. Target User Level (Level 1)
        mockNextResult([{ hierarchy_level: 1 }]);

        const req = {
            user: { role: 3 },
            params: { id: 999 },
            body: { username: 'hacked' }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await adminController.updateStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Access denied')
        }));
      });
  });
});
