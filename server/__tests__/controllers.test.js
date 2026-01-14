const request = require('supertest');
const mysql = require('mysql2/promise');

// Mock database
const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

// Mock app
const createMockApp = () => ({
  locals: { db: mockDb }
});

describe('Resident Controller Tests', () => {
  let residentController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    residentController = require('../controllers/residentController');
  });
  
  describe('getAll', () => {
    it('should return paginated residents', async () => {
      const mockResidents = [
        { Resident_ID: 'RES-001', First_Name: 'Juan', Last_Name: 'Dela Cruz' }
      ];
      
      mockDb.execute
        .mockResolvedValueOnce([mockResidents]) // Main query
        .mockResolvedValueOnce([[{ total: 1 }]]); // Count query
      
      const req = {
        app: createMockApp(),
        query: { page: 1, limit: 50 }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await residentController.getAll(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        data: mockResidents,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      });
    });
    
    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));
      
      const req = {
        app: createMockApp(),
        query: {}
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await residentController.getAll(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch residents' });
    });
  });
  
  describe('getById', () => {
    it('should return resident by ID', async () => {
      const mockResident = {
        Resident_ID: 'RES-001',
        First_Name: 'Juan',
        Last_Name: 'Dela Cruz'
      };
      
      mockDb.execute.mockResolvedValue([[mockResident]]);
      
      const req = {
        app: createMockApp(),
        params: { id: 'RES-001' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await residentController.getById(req, res);
      
      expect(res.json).toHaveBeenCalledWith(mockResident);
    });
    
    it('should return 404 if resident not found', async () => {
      mockDb.execute.mockResolvedValue([[]]);
      
      const req = {
        app: createMockApp(),
        params: { id: 'RES-999' }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await residentController.getById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Resident not found' });
    });
  });
});

describe('User Controller Tests', () => {
  let userController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    userController = require('../controllers/userController');
  });
  
  describe('getAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: 1, email: 'admin@test.com', role: 'admin' }
      ];
      
      mockDb.execute
        .mockResolvedValueOnce([mockUsers])
        .mockResolvedValueOnce([[{ total: 1 }]]);
      
      const req = {
        app: createMockApp(),
        query: { page: 1, limit: 50 }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await userController.getAll(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      });
    });
  });
});

describe('Admin Controller Tests', () => {
  let adminController;
  
  beforeEach(() => {
    jest.clearAllMocks();
    adminController = require('../controllers/adminController');
  });
  
  describe('getSummary', () => {
    it('should return system summary', async () => {
      // Mock counts
      mockDb.execute
        .mockResolvedValueOnce([[{ total: 100 }]]) // residents
        .mockResolvedValueOnce([[{ total: 50 }]]) // households
        .mockResolvedValueOnce([[{ total: 20 }]]); // blotter cases

      // Mock req and res
      const req = {
        user: { role: 'admin' },
        app: { locals: { db: mockDb } }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await adminController.getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });
});

describe('Error Handler Tests', () => {
  const { errorHandler } = require('../middleware/errorHandler');
  
  // Define mock AppError and ERROR_CODES locally for tests if not exported
  class AppError extends Error {
    constructor(message, statusCode, code) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  
  const ERROR_CODES = {
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  };

  it('should handle AppError correctly', () => {
    const error = new AppError('Not found', 404, ERROR_CODES.NOT_FOUND);
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Not found',
          statusCode: 404
        })
      })
    );
  });
  
  it('should handle validation errors', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    // Simplified error expectation based on middleware implementation
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation failed'
        })
      })
    );
  });
});
