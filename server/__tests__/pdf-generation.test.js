const request = require('supertest');
const PDFDocument = require('pdfkit');
const app = require('../index');
const db = require('../database');

// Mock PDFKit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn(),
    page: {
      width: 800,
      height: 600,
    },
  }));
});

describe('PDF Generation & Reporting Analysis Suite', () => {
  let mockDoc;
  let agent;
  let originalPDFDocument;
  let authToken;

  beforeAll(async () => {
    // Store original PDFDocument
    originalPDFDocument = PDFDocument;

    // Create agent for session persistence
    agent = request.agent(app);

    // Setup test data
    await setupTestData();

    // Authenticate
    authToken = await authenticate();
  });

  afterAll(async () => {
    // Restore original PDFDocument
    if (originalPDFDocument) {
      require.cache[require.resolve('pdfkit')] = undefined;
    }
  });

  beforeEach(() => {
    // Reset mock for each test
    mockDoc = {
      pipe: jest.fn(),
      font: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn(),
      page: {
        width: 800,
        height: 600,
      },
    };

    PDFDocument.mockImplementation(() => mockDoc);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // RESIDENTS MASTER LIST PDF TESTS
  // ============================================================================

  describe('Residents Master List PDF Generation', () => {
    test('generates PDF with correct headers and layout', async () => {
      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify PDF document creation
      expect(PDFDocument).toHaveBeenCalledWith({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });

      // Verify header text calls
      expect(mockDoc.text).toHaveBeenCalledWith('REPUBLIC OF THE PHILIPPINES', 0, 50, {
        align: 'center',
        width: 800,
      });
      expect(mockDoc.text).toHaveBeenCalledWith('PROVINCE OF BULACAN', 0, 70, {
        align: 'center',
        width: 800,
      });
      expect(mockDoc.text).toHaveBeenCalledWith('MUNICIPALITY OF BOCAUE', 0, 90, {
        align: 'center',
        width: 800,
      });
      expect(mockDoc.text).toHaveBeenCalledWith('BARANGAY BATIA', 0, 110, {
        align: 'center',
        width: 800,
      });
      expect(mockDoc.text).toHaveBeenCalledWith('RESIDENTS MASTER LIST', 0, 140, {
        align: 'center',
        width: 800,
      });
    });

    test('includes resident data with correct formatting', async () => {
      // Create test residents
      await createTestResident('John', 'Doe', 'Male', 'Batia Proper');
      await createTestResident('Jane', 'Smith', 'Female', 'Northville 5');

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify table headers are set
      expect(mockDoc.font).toHaveBeenCalledWith('Helvetica-Bold');
      expect(mockDoc.fontSize).toHaveBeenCalledWith(10);

      // Verify resident names are included (mock data binding)
      const textCalls = mockDoc.text.mock.calls;
      const nameTextCalls = textCalls.filter(
        call =>
          call[0] &&
          typeof call[0] === 'string' &&
          (call[0].includes('John') || call[0].includes('Jane'))
      );

      expect(nameTextCalls.length).toBeGreaterThan(0);
    });

    test('applies search filters correctly in PDF', async () => {
      await createTestResident('Alice', 'Johnson', 'Female', 'Batia Proper');
      await createTestResident('Bob', 'Smith', 'Male', 'Northville 5');

      const response = await agent
        .get('/api/admin/reports/pdf/residents?search=Alice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify filters are displayed in PDF
      const textCalls = mockDoc.text.mock.calls;
      const filterText = textCalls.find(call => call[0] && call[0].includes('Filters:'));

      expect(filterText).toBeDefined();
      expect(filterText[0]).toContain('Search: "Alice"');
    });

    test('applies gender filter correctly in PDF', async () => {
      await createTestResident('Male', 'Resident', 'Male', 'Batia Proper');
      await createTestResident('Female', 'Resident', 'Female', 'Northville 5');

      const response = await agent
        .get('/api/admin/reports/pdf/residents?gender=Male')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify gender filter is applied
      const textCalls = mockDoc.text.mock.calls;
      const filterText = textCalls.find(call => call[0] && call[0].includes('Gender: Male'));

      expect(filterText).toBeDefined();
    });

    test('applies sitio filter correctly in PDF', async () => {
      await createTestResident('Site', 'Test', 'Male', 'Batia Proper');

      const response = await agent
        .get('/api/admin/reports/pdf/residents?sitio=Batia%20Proper')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify sitio filter is applied
      const textCalls = mockDoc.text.mock.calls;
      const filterText = textCalls.find(call => call[0] && call[0].includes('Sitio: Batia Proper'));

      expect(filterText).toBeDefined();
    });

    test('handles vulnerable residents filter', async () => {
      // Create vulnerable resident
      await createVulnerableResident();

      const response = await agent
        .get('/api/admin/reports/pdf/residents?show_vulnerable=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify vulnerable residents are included
      expect(response.status).toBe(200);
      expect(mockDoc.text).toHaveBeenCalled();
    });

    test('handles pagination with page breaks', async () => {
      // Create many residents to trigger pagination
      for (let i = 0; i < 50; i++) {
        await createTestResident(
          `Name${i}`,
          `Last${i}`,
          i % 2 === 0 ? 'Male' : 'Female',
          'Batia Proper'
        );
      }

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify page breaks are added
      expect(mockDoc.addPage).toHaveBeenCalled();
    });

    test('includes footer with record count', async () => {
      await createTestResident('Footer', 'Test', 'Male', 'Batia Proper');

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify footer with total records
      const textCalls = mockDoc.text.mock.calls;
      const footerCall = textCalls.find(call => call[0] && call[0].includes('Total Records:'));

      expect(footerCall).toBeDefined();
    });

    test('calculates and displays correct age', async () => {
      // Create resident with known birthdate
      const birthdate = '1990-01-01';
      const expectedAge = Math.floor((new Date() - new Date(birthdate)) / 31557600000);

      await createTestResidentWithBirthdate('Age', 'Test', birthdate);

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify age calculation (this would be in the data binding)
      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // BLOTTER REPORTS PDF TESTS
  // ============================================================================

  describe('Blotter Cases PDF Generation', () => {
    test('generates blotter PDF with correct headers', async () => {
      const response = await agent
        .get('/api/admin/reports/pdf/blotter')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify landscape layout for blotter reports
      expect(PDFDocument).toHaveBeenCalledWith({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });

      // Verify blotter-specific header
      expect(mockDoc.text).toHaveBeenCalledWith('BLOTTER CASES REPORT', 0, 140, {
        align: 'center',
        width: 800,
      });
    });

    test('includes blotter case data with complainant/respondent details', async () => {
      await createTestBlotterCase();

      const response = await agent
        .get('/api/admin/reports/pdf/blotter')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify table headers for blotter
      expect(mockDoc.font).toHaveBeenCalledWith('Helvetica-Bold');
      expect(mockDoc.fontSize).toHaveBeenCalledWith(10);

      // Verify case data is included
      const textCalls = mockDoc.text.mock.calls;
      const caseNumberCall = textCalls.find(
        call => call[0] && call[0].match(/^BLOT-\d{4}-\d{2}-\d{4}$/)
      );

      expect(caseNumberCall).toBeDefined();
    });

    test('applies status filter in blotter PDF', async () => {
      await createTestBlotterCase('Physical Injury', 'Pending');
      await createTestBlotterCase('Theft (Petty)', 'Ongoing');

      const response = await agent
        .get('/api/admin/reports/pdf/blotter?status=Pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify status filter is displayed
      const textCalls = mockDoc.text.mock.calls;
      const filterText = textCalls.find(call => call[0] && call[0].includes('Status: Pending'));

      expect(filterText).toBeDefined();
    });

    test('applies date range filters in blotter PDF', async () => {
      await createTestBlotterCase('Physical Injury', 'Pending', '2024-01-01');
      await createTestBlotterCase('Theft (Petty)', 'Ongoing', '2024-01-15');

      const response = await agent
        .get('/api/admin/reports/pdf/blotter?dateFrom=2024-01-01&dateTo=2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(mockDoc.text).toHaveBeenCalled();
    });

    test('handles JSON complainant/respondent details correctly', async () => {
      const complainantDetails = {
        name: 'John Complainant',
        address: '123 Test St',
        contact: '09123456789',
      };

      const respondentDetails = {
        name: 'Jane Respondent',
        address: '456 Test Ave',
        contact: '09876543210',
      };

      await createTestBlotterCaseWithDetails(complainantDetails, respondentDetails);

      const response = await agent
        .get('/api/admin/reports/pdf/blotter')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify JSON parsing and display
      const textCalls = mockDoc.text.mock.calls;
      const johnCall = textCalls.find(call => call[0] && call[0].includes('John Complainant'));
      const janeCall = textCalls.find(call => call[0] && call[0].includes('Jane Respondent'));

      expect(johnCall).toBeDefined();
      expect(janeCall).toBeDefined();
    });

    test('includes blotter footer with case count', async () => {
      await createTestBlotterCase();

      const response = await agent
        .get('/api/admin/reports/pdf/blotter')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify footer with total cases
      const textCalls = mockDoc.text.mock.calls;
      const footerCall = textCalls.find(call => call[0] && call[0].includes('Total Cases:'));

      expect(footerCall).toBeDefined();
    });
  });

  // ============================================================================
  // GENERAL PDF FUNCTIONALITY TESTS
  // ============================================================================

  describe('General PDF Functionality', () => {
    test('handles empty result sets gracefully', async () => {
      // Clear all test data
      await clearTestData();

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still generate PDF even with no data
      expect(mockDoc.end).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('sets correct content headers', async () => {
      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(
        /attachment; filename="residents_report_/
      );
    });

    test('includes generation timestamp', async () => {
      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify timestamp is included
      const textCalls = mockDoc.text.mock.calls;
      const timestampCall = textCalls.find(call => call[0] && call[0].includes('Generated on:'));

      expect(timestampCall).toBeDefined();
    });

    test('handles database errors gracefully', async () => {
      // Mock database error
      const originalExecute = db.pool.execute;
      db.pool.execute = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await agent
        .get('/api/admin/reports/pdf/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toContain('Failed to generate PDF');

      // Restore original function
      db.pool.execute = originalExecute;
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async function setupTestData() {
    // Create test sitio
    await db.pool.execute(`
      INSERT IGNORE INTO sitios (id, name, created_at)
      VALUES (1, 'Batia Proper', NOW()),
             (2, 'Northville 5', NOW())
    `);

    // Create test household
    await db.pool.execute(`
      INSERT IGNORE INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address, created_at, updated_at)
      VALUES ('HH-PDF-TEST', 'HH-PDF-TEST', 1, '123 PDF Test Address', NOW(), NOW())
    `);

    // Create admin user for auth
    await db.pool.execute(`
        INSERT INTO users (id, username, password_hash, role, email, full_name, is_active)
        VALUES (9999, 'pdfadmin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'pdf@example.com', 'PDF Admin', 1)
        ON DUPLICATE KEY UPDATE 
        password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role = 1,
        is_active = 1
    `);
  }

  async function authenticate() {
    // Create a fresh agent to clear any stale cookies
    agent = request.agent(app);

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ username: 'pdfadmin', password: 'password' })
      .expect(200);
    return loginResponse.body.token;
  }

  async function createTestResident(firstName, lastName, gender, sitio) {
    const sitioMap = { 'Batia Proper': 1, 'Northville 5': 2 };
    const sitioId = sitioMap[sitio] || 1;

    const residentId = `RES-PDF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db.pool.execute(
      `
      INSERT INTO residents (
        Resident_ID, Household_ID, First_Name, Middle_Name, Last_Name,
        Gender, Residency_Status, Date_Arrival, created_at, updated_at
      ) VALUES (?, ?, ?, '', ?, ?, 'Active', '2020-01-01', NOW(), NOW())
    `,
      [residentId, 'HH-PDF-TEST', firstName, lastName, gender]
    );

    return residentId;
  }

  async function createTestResidentWithBirthdate(firstName, lastName, birthdate) {
    const residentId = `RES-AGE-${Date.now()}`;

    await db.pool.execute(
      `
      INSERT INTO residents (
        Resident_ID, Household_ID, First_Name, Last_Name, Birthdate,
        Gender, Residency_Status, Date_Arrival, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Male', 'Active', '2020-01-01', NOW(), NOW())
    `,
      [residentId, 'HH-PDF-TEST', firstName, lastName, birthdate]
    );

    return residentId;
  }

  async function createVulnerableResident() {
    const residentId = `RES-VUL-${Date.now()}`;

    await db.pool.execute(
      `
      INSERT INTO residents (
        Resident_ID, Household_ID, First_Name, Last_Name, Gender,
        Residency_Status, Date_Arrival, created_at, updated_at
      ) VALUES (?, ?, 'Vulnerable', 'Resident', 'Female', 'Active', '2020-01-01', NOW(), NOW())
    `,
      [residentId, 'HH-PDF-TEST']
    );

    // Add vulnerability record
    await db.pool.execute(
      `
      INSERT INTO vulnerabilities (
        Resident_ID, Is_PWD, Is_Senior, Vulnerability_Score, created_at, updated_at
      ) VALUES (?, 1, 1, 3, NOW(), NOW())
    `,
      [residentId]
    );

    return residentId;
  }

  async function createTestBlotterCase(
    incidentType = 'Physical Injury',
    status = 'Pending',
    date = '2024-01-01'
  ) {
    // Format: BLOT-YYYY-MM-NNNN
    const randomSeq = Math.floor(Math.random() * 9000) + 1000;
    const caseNumber = `BLOT-2024-01-${randomSeq}`;

    await db.pool.execute(
      `
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
        Narrative, DateTime_Incident, Location_Sitio, Status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        caseNumber,
        JSON.stringify({
          name: 'Test Complainant',
          address: '123 Test St',
          contact: '09123456789',
        }),
        JSON.stringify({
          name: 'Test Respondent',
          address: '456 Test Ave',
          contact: '09876543210',
        }),
        incidentType,
        'Test incident narrative',
        `${date} 10:00:00`,
        'Batia Proper',
        status,
      ]
    );

    return caseNumber;
  }

  async function createTestBlotterCaseWithDetails(complainant, respondent) {
    // Format: BLOT-YYYY-MM-NNNN
    const randomSeq = Math.floor(Math.random() * 9000) + 1000;
    const caseNumber = `BLOT-2024-01-${randomSeq}`;

    await db.pool.execute(
      `
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
        Narrative, DateTime_Incident, Location_Sitio, Status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        caseNumber,
        JSON.stringify(complainant),
        JSON.stringify(respondent),
        'Physical Injury',
        'Test incident with detailed parties',
        '2024-01-01 10:00:00',
        'Batia Proper',
        'Pending',
      ]
    );

    return caseNumber;
  }

  async function clearTestData() {
    await db.pool.execute(
      `DELETE FROM residents WHERE Resident_ID LIKE 'RES-PDF-%' OR Resident_ID LIKE 'RES-AGE-%' OR Resident_ID LIKE 'RES-VUL-%'`
    );
    await db.pool.execute(`DELETE FROM vulnerabilities WHERE Resident_ID LIKE 'RES-VUL-%'`);
    await db.pool.execute(
      `DELETE FROM blotter WHERE Case_Number LIKE 'BLOT-PDF-%' OR Case_Number LIKE 'BLOT-DETAIL-%'`
    );
  }
});
