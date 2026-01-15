const request = require('supertest');
const app = require('../../../index');
const db = require('../../../database');

describe('API: Authentication & RBAC', () => {
  let adminToken, captainToken, secretaryToken, clerkToken;

  beforeAll(async () => {
    // Helper to login and get token
    const login = async (username, password) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username, password });
      return res.body.token;
    };

    // Login with seeded users
    // Passwords are set to 'password123' by 03_initial_staff_users.js via testDbManager
    adminToken = await login('superadmin', 'password123');
    captainToken = await login('captain', 'password123');
    secretaryToken = await login('secretary', 'password123');
    clerkToken = await login('clerk', 'password123');
  });

  afterAll(async () => {
    await db.end();
  });

  describe('Login Verification', () => {
    it('should login superadmin successfully', () => {
      expect(adminToken).toBeDefined();
    });

    it('should login captain successfully', () => {
      expect(captainToken).toBeDefined();
    });

    it('should login secretary successfully', () => {
      expect(secretaryToken).toBeDefined();
    });

    it('should login clerk successfully', () => {
      expect(clerkToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'superadmin', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC: Route Protection', () => {
    // 1. Admin Routes (Only Admin should access)
    // Assuming /api/users is an admin-only route
    it('Admin should access admin-only routes', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      // 200 OK or 200 [] is expected, definitely not 403/401
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    it('Clerk should NOT access admin-only routes', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clerkToken}`);
      expect(res.status).toBe(403);
    });

    // 2. Shared Routes (Authenticated Users)
    // Residents listing should be accessible by all staff
    it('Clerk should access resident listing', async () => {
      const res = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${clerkToken}`);
      expect(res.status).toBe(200);
    });

    it('Secretary should access resident listing', async () => {
      const res = await request(app)
        .get('/api/residents')
        .set('Authorization', `Bearer ${secretaryToken}`);
      expect(res.status).toBe(200);
    });
  });
});
