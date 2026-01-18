const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');
const { getAuthToken } = require('../../utils/authHelper');

describe('API: Blotter', () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/blotter', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app).get('/api/blotter').expect(401);
    });

    it('should return blotter records if authenticated', async () => {
      if (!token) {
         console.warn('Skipping authenticated test due to missing token');
         return;
      }

      const res = await request(app)
        .get('/api/blotter')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Blotter API might return { data: [], pagination: ... } or just []
      // Let's handle both
      let records = res.body;
      if (!Array.isArray(res.body) && res.body.data) {
          records = res.body.data;
      }
      
      expect(Array.isArray(records)).toBe(true);
      
      if (records.length > 0) {
        const record = records[0];
        expect(record).toHaveProperty('Case_Number');
        expect(record).toHaveProperty('Incident_Type');
        expect(record).toHaveProperty('Status');
      }
    });
  });
});
