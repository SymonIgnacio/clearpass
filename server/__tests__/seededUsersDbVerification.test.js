const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      port: Number.parseInt(url.port || '3306', 10),
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  };
};

describe('DB verification: roles + seeded users', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(getConfig());
  });

  afterAll(async () => {
    if (conn) await conn.end();
  });

  test('roles table contains expected IDs', async () => {
    const [rows] = await conn.execute('SELECT id, role_name FROM roles ORDER BY id');
    const map = new Map(rows.map((r) => [Number(r.id), String(r.role_name)]));

    expect(map.get(1)).toMatch(/IT Admin/i);
    expect(map.get(2)).toMatch(/Captain/i);
    expect(map.get(3)).toMatch(/Secretary/i);
    expect(map.get(4)).toMatch(/Clerk/i);
    expect(map.get(6)).toMatch(/Blotter/i);
    expect(map.get(12)).toMatch(/Resident/i);
  });

  test('seeded usernames have DB-aligned role IDs', async () => {
    const usernames = ['superadmin', 'captain', 'secretary', 'clerk', 'officer', 'resident'];
    const expected = new Map([
      ['superadmin', 1],
      ['captain', 2],
      ['secretary', 3],
      ['clerk', 4],
      ['officer', 6],
      ['resident', 12],
    ]);

    const [rows] = await conn.execute(
      `SELECT username, role, password_hash FROM users WHERE username IN (${usernames.map(() => '?').join(',')})`,
      usernames
    );

    const found = new Map(rows.map((r) => [String(r.username), { role: Number(r.role), password_hash: r.password_hash }]));
    for (const u of usernames) {
      expect(found.has(u)).toBe(true);
      expect(found.get(u).role).toBe(expected.get(u));
    }
  });

  test('seeded accounts have password hashes set (smoke)', async () => {
    const usernames = ['superadmin', 'captain', 'secretary', 'clerk', 'officer', 'resident'];
    const [rows] = await conn.execute(
      `SELECT username, password_hash FROM users WHERE username IN (${usernames.map(() => '?').join(',')})`,
      usernames
    );
    const byUser = new Map(rows.map((r) => [String(r.username), r.password_hash]));
    for (const u of usernames) {
      expect(byUser.has(u)).toBe(true);
      const hash = byUser.get(u);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(20);
    }
  });
});
