const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');
const { getAuthToken } = require('../../utils/authHelper');

describe('API: Households', () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /api/households', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app).get('/api/households').expect(401);
    });

    it('should return list of households if authenticated', async () => {
      if (!token) {
        console.warn('Skipping authenticated test due to missing token');
        return;
      }
      
      const res = await request(app)
        .get('/api/households')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      
      if (res.body.length > 0) {
        const household = res.body[0];
        expect(household).toHaveProperty('Household_ID');
        expect(household).toHaveProperty('Household_Number');
        expect(household).toHaveProperty('Street_Address');
      }
    });
  });
});
