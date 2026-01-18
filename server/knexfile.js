const path = require('path');
require('dotenv').config();

// Database configuration function (same as server/index.js and authController.js)
function getDatabaseConfig() {
  // Prefer Railway's DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading slash
      port: parseInt(url.port) || 3306,
    };
  }

  // Fallback to individual environment variables (legacy support)
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: process.env.DB_PORT || 3306,
  };
}

module.exports = {
  development: {
    client: 'mysql2',
    connection: getDatabaseConfig(),
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME_TEST || 'barangay_management_test',
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
    pool: {
      min: 1,
      max: 5,
    },
  },

  production: {
    client: 'mysql2',
    connection: getDatabaseConfig(),
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};
