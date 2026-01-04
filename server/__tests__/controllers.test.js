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
    residentController = require('../server/controllers/residentController');
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
    userController = require('../server/controllers/userController');
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
    adminController = require('../server/controllers/adminController');
  });
  
  describe('getSummary', () => {
    it('should return system summary', async () => {
      mockDb.execute
        .mockResolvedValueOnce([[{ total: 10, active: 8 }]]) // Users
        .mockResolvedValueOnce([[{ total: 5, active: 2 }]]) // Blotter
        .mockResolvedValueOnce([[{ total: 20 }]]); // Certificates
      
      const req = {
        app: createMockApp()
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await adminController.getSummary(req, res);
      
      expect(res.json).toHaveBeenCalled();
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Error Handler Tests', () => {
  const { errorHandler, AppError, ERROR_CODES } = require('../server/middleware/errorHandler');
  
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
          code: ERROR_CODES.NOT_FOUND,
          message: 'Not found'
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
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR
        })
      })
    );
  });
});
