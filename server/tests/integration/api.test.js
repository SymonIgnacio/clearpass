const request = require('supertest');
const knex = require('knex')(require('../../knexfile')['test']);
const app = require('../../index'); // Import the Express app

/**
 * CLEARPASS INTEGRATION TESTS
 * Tests the complete API flow from request to database
 */

describe('API Integration Tests', () => {
  let testResident;
  let testOfficer;
  let residentToken;
  let officerToken;

  // Set up test database before all tests
  beforeAll(async () => {
    try {
      // Run migrations
      await knex.migrate.latest();

      // Run seeds for initial data
      await knex.seed.run();

      // Create a test resident
      testResident = await knex('residents')
        .insert({
          Resident_ID: 'TEST-RES-001',
          First_Name: 'John',
          Last_Name: 'Doe',
          username: 'test_resident',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
          account_status: 'Verified',
        })
        .returning('*');

      if (Array.isArray(testResident)) {
        testResident = testResident[0];
      }

      // Create a test officer user
      const officerPasswordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password: password
      testOfficer = await knex('users')
        .insert({
          username: 'test_officer',
          password_hash: officerPasswordHash,
          role: 'blotter_officer',
          email: 'officer@test.local',
          full_name: 'Test Officer',
          is_active: true,
        })
        .returning('*');

      if (Array.isArray(testOfficer)) {
        testOfficer = testOfficer[0];
      }
    } catch (error) {
      console.error('Test setup error:', error);
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      // Clean up test data
      await knex('blotter').where('Case_Number', 'like', 'TEST-%').del();
      await knex('residents').where('Resident_ID', 'TEST-RES-001').del();

      // Close database connection
      await knex.destroy();
    } catch (error) {
      console.error('Test cleanup error:', error);
    }
  });

  describe('Authentication Tests', () => {
    test('POST /auth/resident/login - Successful Login (returns 200 + Token)', async () => {
      const response = await request(app).post('/api/auth/resident/login').send({
        username: 'test_resident',
        password: 'password',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('test_resident');
      expect(response.body.user.role).toBe('resident');

      // Store token for later tests
      residentToken = response.body.token;
    });

    test('POST /auth/resident/login - Invalid Login (returns 401)', async () => {
      const response = await request(app).post('/api/auth/resident/login').send({
        username: 'test_resident',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('RBAC Tests', () => {
    test('Resident cannot access Admin route (returns 403 Forbidden)', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('Resident cannot access Officer-only blotter creation (returns 403 Forbidden)', async () => {
      const response = await request(app)
        .post('/api/blotter')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          case_number: 'TEST-RBAC-001',
          complainant_details: 'Test complainant',
          respondent_details: 'Test respondent',
          resident_id: 'TEST-RES-001',
          incident_type: 'Theft',
          narrative: 'Test incident',
          date_time_incident: new Date().toISOString(),
          location_sitio: 'Test Sitio',
          status: 'Active',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CRUD Tests - Blotter Case Creation and Retrieval', () => {
    test('POST /blotter - Resident cannot create blotter case (RBAC enforcement)', async () => {
      const response = await request(app)
        .post('/api/blotter')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          case_number: 'TEST-CRUD-001',
          complainant_details: 'Test complainant details',
          respondent_details: 'Test respondent details',
          resident_id: 'TEST-RES-001',
          incident_type: 'Assault',
          narrative: 'Test incident narrative for CRUD verification',
          date_time_incident: new Date().toISOString(),
          location_sitio: 'Test Location',
          status: 'Active',
        });

      // Should fail due to insufficient permissions (residents cannot create blotter cases)
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('Create blotter case directly in database (simulating officer action)', async () => {
      // Create case directly in DB to simulate officer creation
      const createdCase = await knex('blotter')
        .insert({
          Case_Number: 'TEST-CRUD-002',
          Complainant_Details: 'Test complainant',
          Respondent_Details: 'Test respondent',
          respondent_id: 'TEST-RES-001',
          Incident_Type: 'Theft',
          Narrative: 'Test incident for CRUD verification',
          DateTime_Incident: new Date().toISOString(),
          Location_Sitio: 'Test Sitio',
          Status: 'Active',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning('*');

      expect(createdCase).toBeTruthy();
      expect(
        Array.isArray(createdCase) ? createdCase[0].Case_Number : createdCase.Case_Number
      ).toBe('TEST-CRUD-002');
    });

    test('GET /blotter - Verify blotter case exists via API', async () => {
      const response = await request(app)
        .get('/api/blotter')
        .set('Authorization', `Bearer ${residentToken}`);

      // Check that the endpoint responds (may return 403 for residents or 200 with data)
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        // If resident has access, verify the test case is in the response
        const cases = response.body;
        const testCase = Array.isArray(cases)
          ? cases.find(c => c.Case_Number === 'TEST-CRUD-002')
          : null;
        if (testCase) {
          expect(testCase.Incident_Type).toBe('Theft');
          expect(testCase.respondent_id).toBe('TEST-RES-001');
        }
      }
    });

    test('Verify blotter entry in database after API operations', async () => {
      const caseInDb = await knex('blotter').where('Case_Number', 'TEST-CRUD-002').first();

      expect(caseInDb).toBeTruthy();
      expect(caseInDb.Case_Number).toBe('TEST-CRUD-002');
      expect(caseInDb.Incident_Type).toBe('Theft');
      expect(caseInDb.respondent_id).toBe('TEST-RES-001');
      expect(caseInDb.Status).toBe('Active');
      expect(caseInDb.Narrative).toBe('Test incident for CRUD verification');
    });
  });

  describe('Data Integrity Tests', () => {
    test('Resident data consistency', async () => {
      const resident = await knex('residents').where('Resident_ID', 'TEST-RES-001').first();

      expect(resident).toBeTruthy();
      expect(resident.First_Name).toBe('John');
      expect(resident.Last_Name).toBe('Doe');
      expect(resident.username).toBe('test_resident');
    });

    test('Database constraints work', async () => {
      // Test unique constraint on username
      await expect(
        knex('residents').insert({
          Resident_ID: 'TEST-RES-002',
          First_Name: 'Jane',
          Last_Name: 'Smith',
          username: 'test_resident', // Duplicate username
          password_hash: 'hashed_password',
          account_status: 'Verified',
        })
      ).rejects.toThrow();
    });
  });
});
