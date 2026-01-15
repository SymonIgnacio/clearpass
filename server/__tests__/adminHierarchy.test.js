const request = require('supertest');

// Mock database
const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Mock database module
jest.mock('../database', () => mockDb);

describe('Admin Controller Hierarchy Tests', () => {
  let adminController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require to ensure fresh mock usage
    jest.isolateModules(() => {
        adminController = require('../controllers/adminController');
    });
  });
  
  describe('createStaff Hierarchy Enforcement', () => {
    it('should BLOCK a lower-level officer (Level 2) from creating a higher-level admin (Level 1)', async () => {
      // 1. Mock getRoleLevel queries
      mockDb.execute
        // Query for Requester's Level (Role 2 -> Level 2)
        .mockResolvedValueOnce([[{ hierarchy_level: 2 }]])
        // Query for Target's Level (Role 1 -> Level 1)
        .mockResolvedValueOnce([[{ hierarchy_level: 1 }]]);
      
      const req = {
        user: { role: 2 }, // Requester is Level 2 (e.g., Captain)
        body: {
          username: 'newadmin',
          role_id: 1, // Trying to create Admin
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
        // 1. Mock getRoleLevel queries
        mockDb.execute
          // Query for Requester's Level (Role 1 -> Level 1)
          .mockResolvedValueOnce([[{ hierarchy_level: 1 }]])
          // Query for Target's Level (Role 1 -> Level 1)
          .mockResolvedValueOnce([[{ hierarchy_level: 1 }]])
          // Insert Query
          .mockResolvedValueOnce([{ insertId: 123 }]);
        
        const req = {
          user: { role: 1 }, // Requester is Admin
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
    });

    it('should ALLOW an Admin (Level 1) to create a lower-level officer (Level 2)', async () => {
        // 1. Mock getRoleLevel queries
        mockDb.execute
          // Query for Requester's Level (Role 1 -> Level 1)
          .mockResolvedValueOnce([[{ hierarchy_level: 1 }]])
          // Query for Target's Level (Role 2 -> Level 2)
          .mockResolvedValueOnce([[{ hierarchy_level: 2 }]])
          // Insert Query
          .mockResolvedValueOnce([{ insertId: 124 }]);
        
        const req = {
          user: { role: 1 }, // Requester is Admin
          body: {
            username: 'newcaptain',
            role_id: 2,
            password: 'password123'
          }
        };
        
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        await adminController.createStaff(req, res);
        
        expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateStaff Hierarchy Enforcement', () => {
      it('should BLOCK editing a user with higher authority', async () => {
        // 1. Mock getRoleLevel for Requester
        mockDb.execute
            // Requester Level (Level 3)
            .mockResolvedValueOnce([[{ hierarchy_level: 3 }]])
            // Target User Lookup (has Role 1)
            .mockResolvedValueOnce([[{ role: 1 }]])
            // Target User Level (Level 1)
            .mockResolvedValueOnce([[{ hierarchy_level: 1 }]]);

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
