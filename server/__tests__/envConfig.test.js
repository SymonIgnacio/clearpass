const { getDatabaseConfig, getMissingServerEnv } = require('../config/env');

describe('server environment config', () => {
  test('keeps development database defaults for local setup', () => {
    expect(getDatabaseConfig({ NODE_ENV: 'development' })).toMatchObject({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'barangay_management',
      port: 3306,
    });
  });

  test('does not use insecure production database fallbacks', () => {
    expect(getDatabaseConfig({ NODE_ENV: 'production' })).toMatchObject({
      host: undefined,
      user: undefined,
      password: undefined,
      database: undefined,
      port: 3306,
    });
  });

  test('requires stronger production configuration', () => {
    expect(getMissingServerEnv({
      NODE_ENV: 'production',
      DB_HOST: 'db',
      DB_USER: 'app',
      DB_NAME: 'clearpass',
      JWT_SECRET: 'short',
    })).toEqual([
      'DB_PASSWORD',
      'FRONTEND_URL or FRONTEND_URLS',
      'JWT_SECRET with at least 32 characters',
    ]);
  });
});
