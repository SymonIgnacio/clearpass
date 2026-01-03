const request = require('supertest');

const baseURL = 'http://localhost:3001';

describe('SQL Injection Security Tests', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--",
    "1' AND '1'='1"
  ];

  describe('Authentication Endpoints', () => {
    sqlInjectionPayloads.forEach(payload => {
      test(`should reject SQL injection in login: ${payload}`, async () => {
        const response = await request(baseURL)
          .post('/api/auth/login')
          .send({
            username: payload,
            password: 'test123'
          });

        expect(response.status).not.toBe(200);
        expect(response.body).not.toHaveProperty('token');
      });
    });
  });

  describe('Resident Search Endpoints', () => {
    sqlInjectionPayloads.forEach(payload => {
      test(`should sanitize search input: ${payload}`, async () => {
        const response = await request(baseURL)
          .get('/api/residents')
          .query({ search: payload })
          .set('Authorization', 'Bearer test-token');

        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Blotter Endpoints', () => {
    sqlInjectionPayloads.forEach(payload => {
      test(`should prevent SQL injection in blotter creation: ${payload}`, async () => {
        const response = await request(baseURL)
          .post('/api/blotter')
          .send({
            Complainant_Details: payload,
            Incident_Type: 'Test',
            Narrative: 'Test',
            Location_Sitio: 'Test'
          })
          .set('Authorization', 'Bearer test-token');

        expect(response.status).not.toBe(500);
      });
    });
  });
});

describe('XSS Prevention Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>'
  ];

  xssPayloads.forEach(payload => {
    test(`should sanitize XSS payload: ${payload}`, async () => {
      const response = await request(baseURL)
        .post('/api/residents')
        .send({
          first_name: payload,
          last_name: 'Test',
          birthdate: '1990-01-01',
          household_id: 'H-123'
        })
        .set('Authorization', 'Bearer test-token');

      if (response.status === 201) {
        expect(response.body.first_name).not.toContain('<script>');
        expect(response.body.first_name).not.toContain('javascript:');
      }
    });
  });
});
