const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');

describe('API: Programs & Announcements', () => {
  let adminToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'password123' });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('Announcements', () => {
    it('should create an announcement', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Announcement',
          content: 'This is a test announcement',
          date_posted: new Date().toISOString().split('T')[0],
          is_active: true,
          expires_at: null
        });
      
      expect([200, 201]).toContain(res.status);
    });

    it('should list announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('announcements');
      expect(Array.isArray(res.body.announcements)).toBe(true);
    });
  });

  describe('Programs', () => {
    it('should create a program', async () => {
      const res = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          program_name: 'Test Program',
          description: 'This is a test program',
          program_date: '2026-01-01',
          sitio_id: 1,
          target_beneficiaries: ['Residents'],
          status: 'Planned'
        });
        
      expect([200, 201]).toContain(res.status);
    });

    it('should list programs', async () => {
      const res = await request(app)
        .get('/api/programs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
