const ResidentService = require('../../../services/residentService');

// Mock db object
const mockExecute = jest.fn();
const mockGetConnection = jest.fn();
const mockConnection = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
  execute: jest.fn()
};

const mockDb = {
  execute: mockExecute,
  getConnection: mockGetConnection
};

describe('ResidentService', () => {
  let residentService;

  beforeEach(() => {
    residentService = new ResidentService(mockDb);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated results', async () => {
      // Mock data
      const mockRows = [{ Resident_ID: '1', First_Name: 'John' }];
      const mockCount = [{ total: 1 }];

      mockExecute
        .mockResolvedValueOnce([mockRows]) // First call: select residents
        .mockResolvedValueOnce([mockCount]); // Second call: count total

      const result = await residentService.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockRows);
      expect(result.pagination.total).toBe(1);
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it('should apply search filters', async () => {
      mockExecute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ total: 0 }]);
      
      await residentService.getAll({ search: 'Doe' });
      
      const firstCallArgs = mockExecute.mock.calls[0];
      expect(firstCallArgs[0]).toContain('LIKE ?');
      expect(firstCallArgs[1]).toContain('%Doe%');
    });
  });

  describe('getById', () => {
    it('should return resident if found', async () => {
      const mockResident = { Resident_ID: '1', First_Name: 'Jane' };
      mockExecute.mockResolvedValueOnce([[mockResident]]);

      const result = await residentService.getById('1');
      expect(result).toEqual(mockResident);
    });

    it('should return null if not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const result = await residentService.getById('999');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const validData = {
      household_id: 'HH-1',
      first_name: 'New',
      last_name: 'Resident',
      birthdate: '1990-01-01',
      email: 'new@example.com',
      gender: 'Male'
    };

    beforeEach(() => {
        mockGetConnection.mockResolvedValue(mockConnection);
        mockConnection.execute.mockResolvedValue([[]]); // Default successful execution
    });

    it('should create a resident successfully', async () => {
        // Mock specific query responses
        // 1. Check existing email -> []
        // 2. Check household -> [{ Household_ID: 'HH-1' }]
        // 3. Insert Resident -> success
        // 4. Insert User -> success
        // 5. Insert Vulnerabilities -> success
        // 6. Update Household -> success
        
        mockConnection.execute
            .mockResolvedValueOnce([[]]) // Email check
            .mockResolvedValueOnce([[{ Household_ID: 'HH-1' }]]) // Household check
            .mockResolvedValue([[]]); // Subsequent inserts

        const result = await residentService.create(validData);

        expect(result).toHaveProperty('resident_code');
        expect(result).toHaveProperty('temp_password');
        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw error if email exists', async () => {
        mockConnection.execute.mockResolvedValueOnce([[{ email: 'taken@example.com' }]]);

        await expect(residentService.create(validData)).rejects.toThrow('Email address is already registered');
        expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });
});
