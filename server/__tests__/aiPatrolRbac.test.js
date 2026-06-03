const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ROLES } = require('../config/roles');

const JWT_SECRET = 'ai-patrol-rbac-test-secret-with-32-chars';

const createApp = () => {
  jest.resetModules();
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.AI_SERVICE_ENABLED = 'false';

  const aiRoutes = require('../routes/aiRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes({ execute: jest.fn() }));
  return app;
};

const tokenForRole = role => jwt.sign({ id: `user-${role}`, role }, JWT_SECRET, { expiresIn: '5m' });

describe('AI patrol RBAC', () => {
  test.each([
    ['admin', ROLES.ADMIN],
    ['captain', ROLES.CAPTAIN],
    ['blotter officer', ROLES.BLOTTER_OFFICER],
  ])('allows %s through RBAC before AI service availability check', async (_label, role) => {
    const app = createApp();

    const response = await request(app)
      .post('/api/ai/patrol')
      .set('Authorization', `Bearer ${tokenForRole(role)}`)
      .send({});

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ message: 'AI service is currently disabled' });
  });

  test.each([
    ['secretary', ROLES.SECRETARY],
    ['clerk', ROLES.CLERK],
    ['resident', ROLES.RESIDENT],
  ])('blocks %s from patrol suggestions', async (_label, role) => {
    const app = createApp();

    const response = await request(app)
      .post('/api/ai/patrol')
      .set('Authorization', `Bearer ${tokenForRole(role)}`)
      .send({});

    expect(response.status).toBe(403);
  });

  test('requires authentication', async () => {
    const app = createApp();

    const response = await request(app).post('/api/ai/patrol').send({});

    expect(response.status).toBe(401);
  });
});
