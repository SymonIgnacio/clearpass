const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');
const { getAuthToken } = require('../../utils/authHelper');

describe('API: Residents', () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/residents', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app).get('/api/residents').expect(401);
    });

    it('should return list of residents if authenticated', async () => {
      if (!token) {
        console.warn('Skipping authenticated test due to missing token');
        return;
      }
      
      const res = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // Basic Data Validation
      if (res.body.data.length > 0) {
        const resident = res.body.data[0];
        expect(resident).toHaveProperty('Resident_ID');
        expect(resident).toHaveProperty('First_Name');
        expect(resident).toHaveProperty('Last_Name');
      }
    });
  });
});
