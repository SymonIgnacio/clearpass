const request = require('supertest');
const app = require('./index');
const db = require('./database');

async function testGet() {
  try {
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin', password: 'password123' });
    const token = loginRes.body.token;
    console.log('Token obtained:', !!token);

    // Get Programs
    const res = await request(app)
      .get('/api/programs')
      .set('Authorization', `Bearer ${token}`);
    
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

testGet();
