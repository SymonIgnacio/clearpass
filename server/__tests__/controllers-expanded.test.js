const request = require('supertest');
const express = require('express');
const residentController = require('../controllers/residentController');
const householdController = require('../controllers/householdController');
const userController = require('../controllers/userController');
const blotterController = require('../controllers/blotterController');

// Mock database
const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

const app = express();
app.use(express.json());
app.locals.db = mockDb;

describe('Resident Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAll returns residents list', async () => {
    mockDb.execute.mockResolvedValue([[
      { Resident_ID: 1, First_Name: 'Juan', Last_Name: 'Dela Cruz' }
    ]]);

    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await residentController.getAll(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ Resident_ID: 1 })
    ]));
  });

  test('getById returns single resident', async () => {
    mockDb.execute.mockResolvedValue([[
      { Resident_ID: 1, First_Name: 'Juan' }
    ]]);

    const req = { params: { id: 1 }, app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await residentController.getById(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ Resident_ID: 1 }));
  });

  test('create validates required fields', async () => {
    const req = { body: {}, app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await residentController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Household Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAll returns households', async () => {
    mockDb.execute.mockResolvedValue([[
      { Household_ID: 1, Household_Number: 'HH-001' }
    ]]);

    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await householdController.getAll(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAll returns users list', async () => {
    mockDb.execute.mockResolvedValue([[
      { id: 1, username: 'admin', role: 'admin' }
    ]]);

    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await userController.getAll(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});

describe('Blotter Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAll returns blotter entries', async () => {
    mockDb.execute.mockResolvedValue([[
      { case_number: 'BL-001', incident_type: 'Theft' }
    ]]);

    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await blotterController.getAll(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
