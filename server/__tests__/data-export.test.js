const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('../index');
const db = require('../database');
const xlsx = require('xlsx');

describe('Data Export Verification Suite', () => {
  let testDb;
  let agent;
  let authToken;

  beforeAll(async () => {
    // Create test database connection
    testDb = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    await setupTestData();
  });

  afterAll(async () => {
    if (testDb) await testDb.end();
  });

  beforeEach(async () => {
    await cleanupTestData();
    agent = request.agent(app);
    await authenticate();
  });

  // ============================================================================
  // DATA EXPORT TESTS
  // ============================================================================

  describe('Data Export Functionality', () => {
    test('Exports residents to JSON format', async () => {
      // Create test data
      await createTestResident('Export', 'User1', 'Batia Proper');
      await createTestResident('Export', 'User2', 'Northville 5');

      const response = await agent
        .get('/api/residents/export?format=json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('residents_export.json');
      
      const data = response.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      
      const exportedUser = data.find(u => u.First_Name === 'Export');
      expect(exportedUser).toBeDefined();
      expect(exportedUser).toHaveProperty('Sitio');
      expect(exportedUser).toHaveProperty('Residency_Status');
    });

    test('Exports residents to CSV format', async () => {
      await createTestResident('CSV', 'Test', 'Batia Proper');

      const response = await agent
        .get('/api/residents/export?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('residents_export.csv');
      
      const csvContent = response.text;
      expect(csvContent).toContain('Resident_ID,First_Name,Last_Name');
      expect(csvContent).toContain('CSV,Test');
    });

    test('Exports residents to Excel (XLSX) format', async () => {
      await createTestResident('Excel', 'Test', 'Batia Proper');

      const response = await agent
        .get('/api/residents/export?format=xlsx')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('residents_export.xlsx');
      
      // Verify buffer content by reading it back with xlsx
      const workbook = xlsx.read(response.body, { type: 'buffer' });
      // The sheet name might be default 'Sheet1' if not explicitly set in controller
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      const exportedUser = data.find(u => u.First_Name === 'Excel');
      expect(exportedUser).toBeDefined();
    });

    test('Handles special characters in export', async () => {
      await createTestResident('Ñño', 'Nuñez', 'Batia Proper');

      const response = await agent
        .get('/api/residents/export?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify UTF-8 characters are preserved
      expect(response.text).toContain('Ñño');
      expect(response.text).toContain('Nuñez');
    });

    test('Handles invalid format request', async () => {
      await agent
        .get('/api/residents/export?format=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async function setupTestData() {
    // Create admin user
    await testDb.execute(`
      INSERT IGNORE INTO users (id, username, password_hash, role, email, is_active)
      VALUES (1, 'exportadmin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'export@example.com', 1)
    `);

    // Create sitios
    await testDb.execute(`
      INSERT IGNORE INTO sitios (id, name, created_at)
      VALUES (1, 'Batia Proper', NOW()), (2, 'Northville 5', NOW())
    `);

    // Create household
    await testDb.execute(`
      INSERT IGNORE INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address)
      VALUES ('HH-EXPORT', 'HH-EXPORT', 1, 'Export St.')
    `);
  }

  async function authenticate() {
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ username: 'exportadmin', password: 'password' })
      .expect(200);
    authToken = loginResponse.body.token;
  }

  async function createTestResident(firstName, lastName, sitioName) {
    const sitioId = sitioName === 'Batia Proper' ? 1 : 2;
    const residentId = `RES-EXP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    await testDb.execute(`
      INSERT INTO residents (
        Resident_ID, Household_ID, First_Name, Last_Name, Gender, 
        Residency_Status, Birthdate, created_at, updated_at
      ) VALUES (?, 'HH-EXPORT', ?, ?, 'Male', 'Active', '1990-01-01', NOW(), NOW())
    `, [residentId, firstName, lastName]);
  }

  async function cleanupTestData() {
    await testDb.execute("DELETE FROM residents WHERE Resident_ID LIKE 'RES-EXP-%'");
  }
});
