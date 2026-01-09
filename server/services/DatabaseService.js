const db = require('../database');

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // Execute query with automatic connection handling
  async execute(sql, params = []) {
    return await this.db.execute(sql, params);
  }

  // Execute transaction with automatic rollback on error
  async transaction(callback) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Execute multiple queries in transaction
  async batchExecute(queries) {
    return await this.transaction(async (connection) => {
      const results = [];
      for (const { sql, params } of queries) {
        const [result] = await connection.execute(sql, params);
        results.push(result);
      }
      return results;
    });
  }

  // Get single record
  async findOne(sql, params = []) {
    const [rows] = await this.execute(sql, params);
    return rows[0] || null;
  }

  // Get multiple records
  async findMany(sql, params = []) {
    const [rows] = await this.execute(sql, params);
    return rows;
  }

  // Insert record and return ID
  async insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await this.execute(sql, values);
    return result.insertId;
  }

  // Update record
  async update(table, data, where, whereParams = []) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const [result] = await this.execute(sql, [...values, ...whereParams]);
    return result.affectedRows;
  }

  // Delete record
  async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const [result] = await this.execute(sql, whereParams);
    return result.affectedRows;
  }

  // Check if record exists
  async exists(table, where, whereParams = []) {
    const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
    const record = await this.findOne(sql, whereParams);
    return !!record;
  }

  // Get record count
  async count(table, where = '1=1', whereParams = []) {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    const result = await this.findOne(sql, whereParams);
    return result.count;
  }
}

module.exports = DatabaseService;