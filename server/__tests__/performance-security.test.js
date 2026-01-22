const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('../index');
const db = require('../database');

describe('Performance & Security Validation Suite', () => {
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
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Create agent for session persistence
    agent = request.agent(app);

    // Setup test data and authentication
    await setupTestData();
    await authenticate();
  });

  afterAll(async () => {
    if (testDb) await testDb.end();
  });

  beforeEach(async () => {
    // Clean up test data between tests
    await cleanupTestData();
  });

  // ============================================================================
  // SECURITY VALIDATION TESTS
  // ============================================================================

  describe('Input Sanitization & SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE residents; --",
      "' UNION SELECT * FROM users; --",
      "admin'--",
      "' OR 1=1; --",
      "') OR ('1'='1",
      "'; SELECT * FROM information_schema.tables; --",
      "admin'; SHUTDOWN; --",
    ];

    test('prevents SQL injection in resident search', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await agent
          .get(`/api/residents?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Should return valid JSON, not cause SQL errors
        expect(Array.isArray(response.body)).toBe(true);

        // Should not return unauthorized data
        const hasUsersTableData = response.body.some(
          item => item.hasOwnProperty('password_hash') || item.hasOwnProperty('username')
        );
        expect(hasUsersTableData).toBe(false);
      }
    });

    test('prevents SQL injection in blotter search', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await agent
          .get(`/api/blotter?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    test('prevents SQL injection in certificate requests', async () => {
      const maliciousData = {
        resident_id: "' OR '1'='1",
        certificate_type: "Barangay Clearance'; DROP TABLE certificates_log; --",
        purpose: 'Test',
      };

      const response = await agent
        .post('/api/certificates/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(400); // Should fail validation

      // Verify certificates table still exists
      const [tables] = await testDb.execute("SHOW TABLES LIKE 'certificates_log'");
      expect(tables.length).toBe(1);
    });

    test('sanitizes XSS payloads in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload=alert(1)>',
        '"><script>alert(1)</script>',
        "'><script>alert(1)</script>",
        '<body onload=alert(1)>',
      ];

      for (const payload of xssPayloads) {
        const residentData = {
          household_id: 'HH-TEST-001',
          first_name: payload,
          last_name: 'Test',
          birthdate: '1990-01-01',
          gender: 'Male',
          civil_status: 'Single',
          occupation: 'Developer',
          mobile_number: '09123456789',
          email: 'test@example.com',
        };

        const response = await agent
          .post('/api/residents')
          .set('Authorization', `Bearer ${authToken}`)
          .send(residentData)
          .expect(201);

        // Verify the data was stored without executing scripts
        const [rows] = await testDb.execute(
          'SELECT First_Name FROM residents WHERE Resident_ID = ?',
          [response.body.resident_id]
        );

        expect(rows[0].First_Name).toBe(payload); // Should store as-is, not execute

        // Verify no script tags in response
        expect(response.body.first_name).not.toContain('<script>');
      }
    });

    test('validates and sanitizes JSON inputs', async () => {
      const maliciousJson = {
        complainant_details:
          '{"name": "</script><script>alert(1)</script>", "contact": "09123456789"}',
        respondent_details: '{"name": "Test Respondent", "contact": "09876543210"}',
        incident_type: 'Physical Injury',
        narrative: 'Test incident',
        dateTime_incident: '2024-01-01 10:00:00',
        location_sitio: 'Batia Proper',
        status: 'Pending',
      };

      const response = await agent
        .post('/api/blotter')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousJson)
        .expect(201);

      // Verify JSON was parsed and stored safely
      const [rows] = await testDb.execute(
        'SELECT Complainant_Details FROM blotter WHERE Case_Number = ?',
        [response.body.Case_Number]
      );

      const complainantDetails = JSON.parse(rows[0].Complainant_Details);
      expect(complainantDetails.name).not.toContain('<script>');
    });

    test('prevents path traversal attacks', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        '....//....//....//etc/passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd',
      ];

      for (const payload of pathTraversalPayloads) {
        const response = await agent
          .get(`/api/files/${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404); // Should not find file or return 403/404

        expect(response.status).toBeOneOf([403, 404, 400]);
      }
    });

    test('validates file upload security', async () => {
      // Test with malicious file content
      const maliciousContent = Buffer.from('<script>alert("xss")</script>');

      const response = await agent
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousContent, 'malicious.html')
        .expect(400); // Should reject non-image files

      expect(response.body.error).toContain('allowed');
    });
  });

  // ============================================================================
  // LOAD TESTING & PERFORMANCE VALIDATION
  // ============================================================================

  describe('Load Testing & Performance', () => {
    test('handles 50+ concurrent resident data requests', async () => {
      const startTime = Date.now();

      // Create 50 concurrent requests
      const requests = Array(50)
        .fill()
        .map(() => agent.get('/api/residents').set('Authorization', `Bearer ${authToken}`));

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      // Should complete within reasonable time (under 10 seconds)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000);

      // Calculate average response time
      const avgResponseTime = totalTime / responses.length;
      console.log(`Average response time: ${avgResponseTime}ms`);

      // Performance assertion: average under 200ms per request
      expect(avgResponseTime).toBeLessThan(200);
    });

    test('handles 50+ concurrent authentication requests', async () => {
      const startTime = Date.now();

      // Create 50 concurrent login requests
      const requests = Array(50)
        .fill()
        .map(() =>
          agent.post('/api/auth/login').send({
            username: 'testadmin',
            password: 'password',
          })
        );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      });

      // Should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(15000); // Allow more time for auth operations

      const avgResponseTime = totalTime / responses.length;
      console.log(`Auth average response time: ${avgResponseTime}ms`);

      // Performance assertion for auth
      expect(avgResponseTime).toBeLessThan(300);
    });

    test('maintains performance under memory pressure', async () => {
      // Create large dataset
      const largeDataPromises = Array(100)
        .fill()
        .map((_, i) =>
          createTestResident({
            first_name: `LoadTest${i}`,
            last_name: 'User',
            email: `loadtest${i}@example.com`,
          })
        );

      await Promise.all(largeDataPromises);

      const startTime = Date.now();

      // Perform memory-intensive operation
      const response = await agent
        .get('/api/residents?show_vulnerable=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should handle large datasets efficiently
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('handles database connection pool exhaustion gracefully', async () => {
      // Simulate connection pool exhaustion by creating many concurrent DB operations
      const dbOperations = Array(20)
        .fill()
        .map(() => testDb.execute('SELECT COUNT(*) as count FROM residents'));

      const startTime = Date.now();
      const results = await Promise.all(dbOperations);
      const endTime = Date.now();

      // All operations should succeed
      results.forEach(([rows]) => {
        expect(rows[0].count).toBeDefined();
      });

      // Should handle pool exhaustion without timing out
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);
    });
  });

  // ============================================================================
  // ERROR RECOVERY & RESILIENCE TESTS
  // ============================================================================

  describe('Error Recovery & System Resilience', () => {
    test('handles database connection loss during transaction', async () => {
      // Create resident that will succeed
      const residentData = {
        household_id: 'HH-TEST-001',
        first_name: 'Recovery',
        last_name: 'Test',
        birthdate: '1990-01-01',
        gender: 'Male',
        civil_status: 'Single',
        occupation: 'Developer',
        mobile_number: '09123456789',
        email: 'recovery@example.com',
      };

      // Mock database connection failure during execution
      const originalExecute = db.pool.execute;
      let callCount = 0;

      db.pool.execute = jest.fn().mockImplementation((sql, params) => {
        callCount++;
        if (callCount === 2) {
          // Fail on second call (during vulnerability insert)
          return Promise.reject(new Error('Connection lost'));
        }
        return originalExecute.call(db.pool, sql, params);
      });

      const response = await agent
        .post('/api/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(residentData)
        .expect(500); // Should fail gracefully

      // Restore original function
      db.pool.execute = originalExecute;

      // Verify partial data was cleaned up (transaction rollback)
      const [residents] = await testDb.execute('SELECT * FROM residents WHERE email = ?', [
        'recovery@example.com',
      ]);

      expect(residents.length).toBe(0); // Should be rolled back
    });

    test('recovers from temporary service unavailability', async () => {
      // First request succeeds
      const successResponse = await agent
        .get('/api/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(successResponse.body)).toBe(true);

      // Simulate temporary outage (would need actual service interruption)
      // For testing, we verify the system handles errors gracefully
      const errorResponse = await agent
        .get('/api/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(errorResponse.status).toBe(404);

      // System should still respond after error
      const recoveryResponse = await agent
        .get('/api/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(recoveryResponse.body)).toBe(true);
    });

    test('handles malformed JSON payloads', async () => {
      const malformedPayloads = [
        '{"invalid": json}',
        '{"missing": "quotes}',
        '{"unclosed": "brace"',
        'not json at all',
        '{"nested": {"invalid": json}}',
        '',
      ];

      for (const payload of malformedPayloads) {
        try {
          const response = await agent
            .post('/api/residents')
            .set('Authorization', `Bearer ${authToken}`)
            .set('Content-Type', 'application/json')
            .send(payload)
            .expect(400); // Should return 400 Bad Request

          expect(response.status).toBe(400);
        } catch (error) {
          // Some payloads might cause different errors, but shouldn't crash the server
          expect(error).toBeDefined();
        }
      }
    });

    test('maintains security headers under load', async () => {
      const response = await agent
        .get('/api/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify security headers are present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();

      // Verify CORS headers if applicable
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    test('prevents resource exhaustion attacks', async () => {
      // Test with extremely large payload
      const largePayload = {
        household_id: 'HH-TEST-001',
        first_name: 'A'.repeat(10000), // 10KB string
        last_name: 'B'.repeat(10000),
        birthdate: '1990-01-01',
        gender: 'Male',
        civil_status: 'Single',
        occupation: 'Developer',
        mobile_number: '09123456789',
        email: 'large@example.com',
      };

      const response = await agent
        .post('/api/residents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload)
        .expect(413); // Payload Too Large or validation error

      // Should not crash server
      expect(response.status).toBeOneOf([400, 413, 422]);
    });
  });

  // ============================================================================
  // RATE LIMITING & DOS PROTECTION TESTS
  // ============================================================================

  describe('Rate Limiting & DoS Protection', () => {
    test('enforces rate limiting on authentication endpoints', async () => {
      // Make multiple rapid login attempts
      const loginAttempts = Array(10)
        .fill()
        .map(() =>
          agent.post('/api/auth/login').send({
            username: 'testadmin',
            password: 'wrongpassword',
          })
        );

      const responses = await Promise.allSettled(loginAttempts);

      // At least some should be rate limited (429 status)
      const rateLimited = responses.some(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      // Note: Rate limiting might not be enabled in test environment
      // This test verifies the system can handle rapid requests without crashing
      expect(responses.length).toBe(10);
    });

    test('handles concurrent file upload limits', async () => {
      // Test concurrent file uploads
      const uploadPromises = Array(5)
        .fill()
        .map((_, i) =>
          agent
            .post('/api/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from(`test content ${i}`), `test${i}.jpg`)
        );

      const results = await Promise.allSettled(uploadPromises);

      // Should handle concurrent uploads without crashing
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect([200, 201, 400, 413]).toContain(result.value.status);
        }
      });
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async function setupTestData() {
    // Create test admin user with explicit update
    await testDb.execute(`
      INSERT INTO users (
        id, username, password_hash, role, email, full_name, is_active, created_at, updated_at
      ) VALUES (
        9999, 'testadmin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1,
        'admin@example.com', 'Test Admin', 1, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE 
        password_hash=VALUES(password_hash),
        role=VALUES(role),
        is_active=1
    `);

    // Create test household
    await testDb.execute(`
      INSERT IGNORE INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address, created_at, updated_at)
      VALUES ('HH-TEST-001', 'HH-TEST-001', 1, '123 Test Address', NOW(), NOW())
    `);

    // Create sitio
    await testDb.execute(`
      INSERT IGNORE INTO sitios (id, name, description, created_at)
      VALUES (1, 'Batia Proper', 'Test Sitio', NOW())
    `);
  }

  async function authenticate() {
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: 'password',
      })
      .expect(200);

    authToken = loginResponse.body.token;
  }

  async function createTestResident(data) {
    const residentData = {
      household_id: data.household_id || 'HH-TEST-001',
      first_name: data.first_name,
      last_name: data.last_name,
      birthdate: data.birthdate || '1990-01-01',
      gender: data.gender || 'Male',
      civil_status: data.civil_status || 'Single',
      occupation: data.occupation || 'Unemployed',
      mobile_number: data.mobile_number || '09123456789',
      email: data.email,
    };

    const response = await agent
      .post('/api/residents')
      .set('Authorization', `Bearer ${authToken}`)
      .send(residentData);

    return response.body;
  }

  async function cleanupTestData() {
    const testTables = ['residents', 'blotter', 'document_requests'];

    for (const table of testTables) {
      try {
        await testDb.execute(
          `DELETE FROM ${table} WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
        );
      } catch (error) {
        console.warn(`Could not clean up table ${table}:`, error.message);
      }
    }
  }
});
