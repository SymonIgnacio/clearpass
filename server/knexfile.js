const path = require('path');
require('dotenv').config();
const { getDatabaseConfig } = require('./config/env');

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
    connection: getDatabaseConfig({ ...process.env, NODE_ENV: 'test' }),
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
