const express = require('express');
const request = require('supertest');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const knexFactory = require('knex');
const knexfile = require('../../../knexfile');
const { ROLES } = require('../../../config/roles');

const getMysqlAdminConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
});

describe('Integration (current): RBAC + DB smoke', () => {
  const testDbName = process.env.DB_NAME_TEST || 'barangay_management_test';
  let knex;
  let db;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME_TEST = testDbName;

    const adminConn = await mysql.createConnection(getMysqlAdminConfig());
    await adminConn.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
    await adminConn.query(`CREATE DATABASE \`${testDbName}\``);
    await adminConn.end();

    knex = knexFactory(knexfile.test);
    await knex.migrate.latest();

    db = await mysql.createPool({
      ...getMysqlAdminConfig(),
      database: testDbName,
      connectionLimit: 5,
      waitForConnections: true,
    });

    await db.execute('DELETE FROM users');
    await db.execute(
      'INSERT INTO users (username, password_hash, role, email, full_name, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      ['it_admin_test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ROLES.ADMIN, 'it_admin@test.local', 'IT Admin Test']
    );
    await db.execute(
      'INSERT INTO users (username, password_hash, role, email, full_name, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      ['resident_test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ROLES.RESIDENT, 'resident@test.local', 'Resident Test']
    );
  });

  afterAll(async () => {
    if (db) await db.end();
    if (knex) await knex.destroy();
  });

  const makeApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.locals.db = db;
    app.use('/api/admin', require('../../../routes/adminRoutes')(db));
    return app;
  };

  const sign = (role, id = '1') =>
    jwt.sign({ id, username: 'test', role, role_name: 'test', mfa_verified: true }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

  test('admin token can access /api/admin/users and returns data', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${sign(ROLES.ADMIN, '1')}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('resident token is forbidden from /api/admin/users', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${sign(ROLES.RESIDENT, '2')}`);
    expect(res.status).toBe(403);
  });
});
