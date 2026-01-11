const residentController = require('../controllers/residentController');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../database', () => {
  const mockConnection = {
    beginTransaction: jest.fn(),
    execute: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  return {
    getConnection: jest.fn().mockResolvedValue(mockConnection),
    execute: jest.fn(),
  };
});
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('../middleware/auditLogger', () => ({
  logAuditEvent: jest.fn(),
  logAuditToDatabase: jest.fn(),
  AUDIT_EVENTS: {}
}));
jest.mock('../utils/documentStorage', () => ({
  isEncryptionEnabled: jest.fn().mockReturnValue(false),
  resolveAndValidateUploadedDocumentPath: jest.fn().mockImplementation(path => path),
  sendStoredDocument: jest.fn()
}));

const db = require('../database');

describe('Resident Controller Unit Tests', () => {
  let req, res;
  let mockConnection;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConnection = await db.getConnection();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin1', role: 'admin' },
      files: []
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    crypto.randomBytes.mockReturnValue({ toString: () => 'random' });
    crypto.createHash.mockReturnValue({ update: () => ({ digest: () => 'hash' }) });
    bcrypt.hash.mockResolvedValue('hashed_password');
  });

  describe('create', () => {
    test('should validate required fields', async () => {
      req.body = { first_name: 'John' }; // Missing fields
      await residentController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Required fields') }));
    });

    test('should create resident and commit transaction', async () => {
      req.body = {
        first_name: 'John', last_name: 'Doe', birthdate: '1990-01-01',
        household_id: 'HH-1', email: 'john@example.com'
      };

      mockConnection.execute
        .mockResolvedValueOnce([[{ Household_ID: 'HH-1' }]]) // Check household
        .mockResolvedValueOnce() // Insert resident
        .mockResolvedValueOnce() // Insert user
        .mockResolvedValueOnce() // Insert vulnerabilities
        .mockResolvedValueOnce(); // Update household count

      await residentController.create(req, res);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Resident created successfully' }));
    });

    test('should rollback on error', async () => {
      req.body = {
        first_name: 'John', last_name: 'Doe', birthdate: '1990-01-01',
        household_id: 'HH-1', email: 'john@example.com'
      };

      mockConnection.execute.mockRejectedValue(new Error('DB Error'));

      await residentController.create(req, res);

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('checkDuplicate', () => {
    test('should detect duplicates', async () => {
      req.body = { first_name: 'John', last_name: 'Doe', birthdate: '1990-01-01' };
      db.execute.mockResolvedValueOnce([[{ Resident_ID: 'RES-1' }]]);

      await residentController.checkDuplicate(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ is_duplicate: true }));
    });
  });

  describe('openRegister', () => {
    test('should process open registration', async () => {
      req.body = {
        first_name: 'John', last_name: 'Doe', birthdate: '1990-01-01',
        email: 'john@example.com', street_address: 'Street', sitio: 'Sitio'
      };

      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Check existing email (empty)
        .mockResolvedValueOnce(); // Insert application

      await residentController.openRegister(req, res);

      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should reject existing email', async () => {
      req.body = {
        first_name: 'John', last_name: 'Doe', birthdate: '1990-01-01',
        email: 'john@example.com', street_address: 'Street', sitio: 'Sitio'
      };

      mockConnection.execute.mockResolvedValueOnce([[{ email: 'john@example.com' }]]);

      await residentController.openRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already registered') }));
    });
  });

  describe('archive', () => {
    test('should archive resident', async () => {
      req.params.id = 'RES-1';

      mockConnection.execute
        .mockResolvedValueOnce() // Update resident
        .mockResolvedValueOnce(); // Update household

      await residentController.archive(req, res);

      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Resident archived successfully' }));
    });
  });
});
