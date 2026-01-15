const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');
const path = require('path');

describe('API: Certificates', () => {
  let adminToken, residentToken;

  beforeAll(async () => {
    // Login Admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'password123' });
    adminToken = loginRes.body.token;

    // Login Resident
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'Symonignacio1@gmail.com', password: '123456' });
    residentToken = resLogin.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('Certificate Types', () => {
    it('should list certificate types', async () => {
      const res = await request(app)
        .get('/api/certificate-types')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Certificate Requests', () => {
    it('should allow resident to request a certificate', async () => {
        if (!residentToken) {
            console.warn('Skipping resident request test - No resident token');
            return;
        }

        const res = await request(app)
            .post('/api/certificate-requests/submit')
            .set('Authorization', `Bearer ${residentToken}`)
            .field('document_type', 'Barangay Clearance')
            .field('purpose', 'Job Application')
            .field('copies', 1)
            .attach('front_id', Buffer.from('dummy'), 'front.jpg')
            .attach('back_id', Buffer.from('dummy'), 'back.jpg');
        
        expect([200, 201]).toContain(res.status);
    });

    it('should list certificate requests for admin', async () => {
        const res = await request(app)
            .get('/api/certificate-requests/admin/all')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
