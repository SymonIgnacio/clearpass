const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getConnectionConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      port: Number.parseInt(url.port || '3306', 10)
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10)
  };
};

const walkFiles = (dir, out = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage' || entry.name === 'logs') continue;
      walkFiles(full, out);
    } else if (entry.isFile()) {
      if (full.endsWith('.js') || full.endsWith('.cjs')) out.push(full);
    }
  }
  return out;
};

const SYSTEM_SCHEMAS = new Set(['information_schema', 'mysql', 'performance_schema', 'sys']);
const IGNORED_TABLE_TOKENS = new Set(['with', 'your', 'json', 'settings']);

const extractTablesFromSql = (sql) => {
  const s = String(sql || '');
  const tables = new Set();
  if (!/^\s*(select|insert|update|delete)\b/i.test(s)) {
    return [];
  }
  const patterns = [
    /\bfrom\s+(?:`?([a-zA-Z0-9_]+)`?\.)?`?([a-zA-Z0-9_]+)`?/gi,
    /\bjoin\s+(?:`?([a-zA-Z0-9_]+)`?\.)?`?([a-zA-Z0-9_]+)`?/gi,
    /\binsert\s+(?:ignore\s+)?into\s+(?:`?([a-zA-Z0-9_]+)`?\.)?`?([a-zA-Z0-9_]+)`?/gi,
    /\bupdate\s+(?:`?([a-zA-Z0-9_]+)`?\.)?`?([a-zA-Z0-9_]+)`?/gi,
    /\bdelete\s+from\s+(?:`?([a-zA-Z0-9_]+)`?\.)?`?([a-zA-Z0-9_]+)`?/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(s))) {
      const schema = m[1] ? String(m[1]) : null;
      const table = m[2] ? String(m[2]) : null;
      if (!table) continue;
      if (IGNORED_TABLE_TOKENS.has(table.toLowerCase())) continue;
      if (schema && SYSTEM_SCHEMAS.has(schema.toLowerCase())) continue;
      tables.add(table);
    }
  }
  return [...tables];
};

const extractTablesFromFile = (content) => {
  const tables = new Set();
  const receiver = '(?:this\\.db|db|connection|conn|pool|auditDb)';
  const execBacktick = new RegExp(`\\b${receiver}\\.execute\\(\\s*\\\`([\\s\\S]*?)\\\`\\s*(?:,|\\))`, 'g');
  const execSingle = new RegExp(`\\b${receiver}\\.execute\\(\\s*\\'([^\\']*?)\\'\\s*(?:,|\\))`, 'g');
  const execDouble = new RegExp(`\\b${receiver}\\.execute\\(\\s*\\\"([^\\\"]*?)\\\"\\s*(?:,|\\))`, 'g');

  const patterns = [execBacktick, execSingle, execDouble];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) {
      const query = m[1];
      if (!query) continue;
      for (const t of extractTablesFromSql(query)) tables.add(t);
    }
  }

  return [...tables];
};

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const serverRoot = path.join(projectRoot, 'server');

  const files = walkFiles(serverRoot);
  const referencedTables = new Set();
  const sourcesByTable = new Map();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const tables = extractTablesFromFile(content);
    for (const t of tables) {
      referencedTables.add(t);
      if (!sourcesByTable.has(t)) sourcesByTable.set(t, []);
      const arr = sourcesByTable.get(t);
      if (arr.length < 3) arr.push(path.relative(projectRoot, file));
    }
  }

  const referenced = [...referencedTables].sort();
  if (referenced.length === 0) {
    console.log('✅ No SQL table references found to verify.');
    return;
  }

  const cfg = getConnectionConfig();
  const conn = await mysql.createConnection(cfg);
  try {
    const [rows] = await conn.execute(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
    `,
      [cfg.database]
    );
    const existing = new Set(rows.map((r) => String(r.table_name)));

    const missing = referenced.filter((t) => !existing.has(t));
    if (missing.length) {
      console.error('❌ Missing tables referenced by server SQL:');
      for (const t of missing) {
        const sources = sourcesByTable.get(t) || [];
        const suffix = sources.length ? ` (e.g. ${sources.join(', ')})` : '';
        console.error(`  - ${t}${suffix}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`✅ Schema verification passed: ${referenced.length} referenced tables exist.`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Schema verification failed:', err?.message || err);
  process.exit(1);
});
