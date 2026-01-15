const request = require('supertest');
const app = require('../../index');

/**
 * Logs in and returns a JWT token.
 * Default credentials match the standard seed.
 */
async function getAuthToken(username = 'admin', password = 'password123') {
  const res = await request(app).post('/api/auth/login').send({ username, password });

  if (res.status !== 200) {
    // If admin login fails, try to create a test user or warn
    console.warn(`AuthHelper: Login failed for ${username}. Status: ${res.status}`);
    return null;
  }
  return res.body.token;
}

module.exports = { getAuthToken };
