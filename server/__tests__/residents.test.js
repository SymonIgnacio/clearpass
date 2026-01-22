const request = require('supertest');
const express = require('express');
const residents = require('../routes/residents'); // Assuming routes are extracted

// Mock database
jest.mock('../database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(() => ({
    beginTransaction: jest.fn(),
    execute: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  })),
}));

const db = require('../database');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/residents', residents);

describe('Residents API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/residents', () => {
    test('should return paginated residents list', async () => {
      const mockResidents = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          Residency_Status: 'Active',
          sitio_name: 'Batia Proper',
        },
        {
          Resident_ID: 'RES-2025-002',
          First_Name: 'Maria',
          Last_Name: 'Santos',
          Residency_Status: 'Active',
          sitio_name: 'Northville 5',
        },
      ];

      db.query
        .mockResolvedValueOnce([mockResidents]) // Residents query
        .mockResolvedValueOnce([{ total: 25 }]); // Count query

      const response = await request(app)
        .get('/api/residents?page=1&limit=10')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(25);
    });

    test('should filter residents by search term', async () => {
      const mockResidents = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          Mobile_Number: '09171234567',
        },
      ];

      db.query.mockResolvedValueOnce([mockResidents]).mockResolvedValueOnce([{ total: 1 }]);

      const response = await request(app)
        .get('/api/residents?search=Juan')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].First_Name).toBe('Juan');
    });

    test('should filter by sitio', async () => {
      const mockResidents = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          sitio_name: 'Batia Proper',
        },
      ];

      db.query.mockResolvedValueOnce([mockResidents]).mockResolvedValueOnce([{ total: 1 }]);

      const response = await request(app)
        .get('/api/residents?sitio_id=1')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].sitio_name).toBe('Batia Proper');
    });

    test('should filter vulnerable residents', async () => {
      const mockResidents = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          Vulnerability_Score: 75,
          Is_Senior: true,
        },
      ];

      db.query.mockResolvedValueOnce([mockResidents]).mockResolvedValueOnce([{ total: 1 }]);

      const response = await request(app)
        .get('/api/residents?show_vulnerable=true')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].Vulnerability_Score).toBe(75);
    });
  });

  describe('POST /api/residents', () => {
    test('should create new resident successfully', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute
        .mockResolvedValueOnce([[{ Household_ID: 'H-2025-001' }]]) // Household check
        .mockResolvedValueOnce() // Resident insert
        .mockResolvedValueOnce() // Vulnerability insert
        .mockResolvedValueOnce(); // Household update

      const newResident = {
        household_id: 'H-2025-001',
        first_name: 'Pedro',
        last_name: 'Garcia',
        birthdate: '1990-05-15',
        gender: 'Male',
        mobile_number: '09171234569',
      };

      const response = await request(app).post('/api/residents').send(newResident);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('resident_id');
      expect(response.body).toHaveProperty('qr_hash');
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should validate required fields', async () => {
      const response = await request(app).post('/api/residents').send({
        first_name: 'Pedro',
        // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid household_id', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockResolvedValueOnce([[]]); // No household found

      const response = await request(app).post('/api/residents').send({
        household_id: 'INVALID-HH',
        first_name: 'Pedro',
        last_name: 'Garcia',
        birthdate: '1990-05-15',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Invalid household_id - household does not exist'
      );
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('POST /api/residents/check-duplicate', () => {
    test('should detect duplicate resident', async () => {
      const duplicateData = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          Birthdate: '1985-03-15',
          Residency_Status: 'Active',
        },
      ];

      db.query.mockResolvedValue([duplicateData]);

      const response = await request(app).post('/api/residents/check-duplicate').send({
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        birthdate: '1985-03-15',
      });

      expect(response.status).toBe(200);
      expect(response.body.is_duplicate).toBe(true);
      expect(response.body.duplicates).toHaveLength(1);
      expect(response.body.duplicates[0].Resident_ID).toBe('RES-2025-001');
    });

    test('should return no duplicates found', async () => {
      db.query.mockResolvedValue([[]]); // No duplicates

      const response = await request(app).post('/api/residents/check-duplicate').send({
        first_name: 'New',
        last_name: 'Resident',
        birthdate: '1995-08-20',
      });

      expect(response.status).toBe(200);
      expect(response.body.is_duplicate).toBe(false);
      expect(response.body.duplicates).toEqual([]);
    });

    test('should validate required fields', async () => {
      const response = await request(app).post('/api/residents/check-duplicate').send({
        first_name: 'Test',
        // Missing last_name and birthdate
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/residents/:id', () => {
    test('should return resident details', async () => {
      const mockResident = {
        Resident_ID: 'RES-2025-001',
        First_Name: 'Juan',
        Last_Name: 'Dela Cruz',
        Birthdate: '1985-03-15',
        Gender: 'Male',
        Residency_Status: 'Active',
        Household_Number: 'HH-001',
        sitio_name: 'Batia Proper',
        Is_4Ps: true,
        Is_PWD: false,
        Is_Senior: false,
        Vulnerability_Score: 25,
      };

      db.query.mockResolvedValue([[mockResident]]);

      const response = await request(app)
        .get('/api/residents/RES-2025-001')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body.Resident_ID).toBe('RES-2025-001');
      expect(response.body.First_Name).toBe('Juan');
      expect(response.body.Is_4Ps).toBe(true);
    });

    test('should return 404 for non-existent resident', async () => {
      db.query.mockResolvedValue([[]]); // No resident found

      const response = await request(app)
        .get('/api/residents/RES-NONEXISTENT')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Resident not found');
    });
  });

  describe('PUT /api/residents/:id', () => {
    test('should update resident successfully', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockResolvedValue();

      const updateData = {
        first_name: 'Juan Carlos',
        mobile_number: '09181234567',
        is_pwd: true,
      };

      const response = await request(app).put('/api/residents/RES-2025-001').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Resident updated successfully');
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should handle partial updates', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockResolvedValue();

      const response = await request(app)
        .put('/api/residents/RES-2025-001')
        .send({ mobile_number: '09181234567' }); // Only one field

      expect(response.status).toBe(200);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should rollback on database error', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/residents/RES-2025-001')
        .send({ first_name: 'New Name' });

      expect(response.status).toBe(500);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('PUT /api/residents/:id/archive', () => {
    test('should archive resident successfully', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute
        .mockResolvedValueOnce() // Update resident status
        .mockResolvedValueOnce(); // Update household count

      const response = await request(app).put('/api/residents/RES-2025-001/archive').send({
        departure_date: '2024-12-01',
        departure_reason: 'Job relocation',
        destination: 'Manila',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Resident archived successfully');
      expect(response.body).toHaveProperty('status', 'Transferred Out');
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should prevent archiving if household has multiple members', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockResolvedValue([{ count: 3 }]); // Multiple residents in household

      const response = await request(app).put('/api/residents/RES-2025-001/archive').send({
        departure_date: '2024-12-01',
        departure_reason: 'Relocation',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('POST /api/residents/:id/generate-qr', () => {
    test('should generate QR code successfully', async () => {
      const mockResident = {
        Resident_ID: 'RES-2025-001',
        First_Name: 'Juan',
        Last_Name: 'Dela Cruz',
      };

      db.query
        .mockResolvedValueOnce([[mockResident]]) // Update QR
        .mockResolvedValueOnce([
          [
            {
              Resident_ID: 'RES-2025-001',
              First_Name: 'Juan',
              Last_Name: 'Dela Cruz',
              sitio_name: 'Batia Proper',
            },
          ],
        ]); // Get updated resident

      const response = await request(app).post('/api/residents/RES-2025-001/generate-qr');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('qr_code');
      expect(response.body).toHaveProperty('resident');
      expect(response.body.resident.First_Name).toBe('Juan');
    });
  });

  describe('GET /api/households/:id/members', () => {
    test('should return household members', async () => {
      const mockHousehold = {
        Household_ID: 'H-2025-001',
        Household_Number: 'HH-001',
        sitio_name: 'Batia Proper',
      };

      const mockMembers = [
        {
          Resident_ID: 'RES-2025-001',
          First_Name: 'Juan',
          Last_Name: 'Dela Cruz',
          Relation_to_Head: 'Head',
          Is_4Ps: true,
          Vulnerability_Score: 25,
        },
        {
          Resident_ID: 'RES-2025-002',
          First_Name: 'Maria',
          Last_Name: 'Dela Cruz',
          Relation_to_Head: 'Spouse',
          Is_Senior: true,
          Vulnerability_Score: 40,
        },
      ];

      db.query
        .mockResolvedValueOnce([mockMembers]) // Members query
        .mockResolvedValueOnce([[mockHousehold]]); // Household query

      const response = await request(app)
        .get('/api/households/H-2025-001/members')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('household');
      expect(response.body).toHaveProperty('members');
      expect(response.body.members).toHaveLength(2);
      expect(response.body.household.Household_Number).toBe('HH-001');
    });
  });
});
