const knex = require('knex');
const mysql = require('mysql2/promise');
const path = require('path');
const knexConfig = require('../../knexfile');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbName = process.env.DB_NAME_TEST || 'barangay_management_test';

const testDbManager = {
  /**
   * Creates the test database if it doesn't exist.
   * This connects to MySQL without selecting a database first.
   */
  async createTestDb() {
    console.log(`Setup: Ensuring database '${dbName}' exists...`);
    console.log(`Setup: Connecting to ${process.env.DB_HOST || 'localhost'} as ${process.env.DB_USER || 'root'}`);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.end();
    console.log(`Setup: Database '${dbName}' ready.`);
  },

  /**
   * Runs migrations and seeds on the test database.
   */
  async migrateAndSeed() {
    console.log('Setup: Running migrations and seeds...');
    const config = knexConfig.test;
    
    // Ensure we are pointing to the test DB
    config.connection.database = dbName;
    
    // Ensure SEED_DEFAULT_PASSWORD is set for seeds to work
    process.env.SEED_DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'password123';
    
    const db = knex(config);
    
    try {
      await db.migrate.latest();
      console.log('Setup: Migrations complete.');
      await db.seed.run();
      console.log('Setup: Seeds complete.');
    } catch (error) {
      console.error('Setup: Migration/Seed failed:', error);
      throw error;
    } finally {
      await db.destroy();
    }
  },
  
  /**
   * Returns a Knex instance connected to the test database.
   */
  getKnexInstance() {
     const config = knexConfig.test;
     config.connection.database = dbName;
     return knex(config);
  }
};

module.exports = testDbManager;
