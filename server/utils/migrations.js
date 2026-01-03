const fs = require('fs');
const path = require('path');

class MigrationManager {
  constructor(db) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, '../migrations');
    this.ensureMigrationsTable();
  }

  async ensureMigrationsTable() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getExecutedMigrations() {
    const [rows] = await this.db.execute('SELECT name FROM migrations ORDER BY id');
    return rows.map(r => r.name);
  }

  async runMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const executed = await this.getExecutedMigrations();
    const pending = files.filter(f => !executed.includes(f));

    for (const file of pending) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(this.migrationsDir, file), 'utf8');
      
      try {
        await this.db.execute(sql);
        await this.db.execute('INSERT INTO migrations (name) VALUES (?)', [file]);
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error.message);
        throw error;
      }
    }

    return { executed: pending.length, total: files.length };
  }
}

module.exports = MigrationManager;
