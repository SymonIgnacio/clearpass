const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const fs = require('fs/promises');
const mysql = require('mysql2/promise');

const REPORTS_DIR = path.resolve(__dirname, '../../reports');

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function ensureReportsDir() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

function markdownTable(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((r) => `| ${headers.map((h) => String(r[h] ?? '')).join(' | ')} |`)
    .join('\n');
  return `${headerLine}\n${sepLine}\n${body}`;
}

async function getAllTables(connection) {
  const [tables] = await connection.execute('SHOW TABLES');
  return tables.map((t) => Object.values(t)[0]);
}

async function getColumns(connection, tableName) {
  const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
  return columns;
}

async function getRowCount(connection, tableName) {
  const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
  return safeNumber(count?.[0]?.count) ?? 0;
}

async function getForeignKeys(connection, databaseName) {
  const [rows] = await connection.execute(
    `
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `,
    [databaseName]
  );
  return rows;
}

async function getIndexes(connection, tableName) {
  const [rows] = await connection.execute(`SHOW INDEX FROM \`${tableName}\``);
  return rows;
}

async function detectBlotterStatusColumn(columns) {
  const names = new Set(columns.map((c) => c.Field));
  if (names.has('status')) return 'status';
  if (names.has('Status')) return 'Status';
  return null;
}

async function detectBlotterDatetimeColumn(columns) {
  const names = new Set(columns.map((c) => c.Field));
  if (names.has('DateTime_Incident')) return 'DateTime_Incident';
  if (names.has('datetime_incident')) return 'datetime_incident';
  if (names.has('incident_datetime')) return 'incident_datetime';
  return null;
}

async function analyzeBlotterTable(connection, databaseName) {
  const tableName = 'blotter';
  const columns = await getColumns(connection, tableName);
  const rowCount = await getRowCount(connection, tableName);
  const statusCol = await detectBlotterStatusColumn(columns);
  const datetimeCol = await detectBlotterDatetimeColumn(columns);
  const columnNames = new Set(columns.map((c) => c.Field));

  const issues = [];

  let statusDistribution = [];
  if (statusCol) {
    const [rows] = await connection.execute(
      `SELECT \`${statusCol}\` as status, COUNT(*) as count FROM \`${tableName}\` GROUP BY \`${statusCol}\` ORDER BY count DESC`
    );
    statusDistribution = rows.map((r) => ({ status: r.status ?? null, count: safeNumber(r.count) ?? 0 }));
  } else {
    issues.push({ type: 'schema', severity: 'high', message: 'No status column detected on blotter' });
  }

  let sitioDistribution = [];
  if (columnNames.has('Location_Sitio')) {
    const [rows] = await connection.execute(
      `SELECT Location_Sitio as sitio, COUNT(*) as count FROM \`${tableName}\` GROUP BY Location_Sitio ORDER BY count DESC`
    );
    sitioDistribution = rows.map((r) => ({ sitio: r.sitio ?? null, count: safeNumber(r.count) ?? 0 }));
  }

  let incidentTypeDistribution = [];
  if (columnNames.has('Incident_Type')) {
    const [rows] = await connection.execute(
      `SELECT Incident_Type as incidentType, COUNT(*) as count FROM \`${tableName}\` GROUP BY Incident_Type ORDER BY count DESC`
    );
    incidentTypeDistribution = rows.map((r) => ({
      incidentType: r.incidentType ?? null,
      count: safeNumber(r.count) ?? 0
    }));
  }

  const caseIdChecks = { total: rowCount, invalidFormat: null, nonBlotPrefix: null };
  if (columnNames.has('Case_Number')) {
    const [invalidFormat] = await connection.execute(
      `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE Case_Number IS NULL OR Case_Number NOT REGEXP '^BLOT-[0-9]{4}-[0-9]{2}-[0-9]{4}$'`
    );
    const [nonBlot] = await connection.execute(
      `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE Case_Number IS NOT NULL AND Case_Number NOT LIKE 'BLOT-%'`
    );
    caseIdChecks.invalidFormat = safeNumber(invalidFormat?.[0]?.count) ?? 0;
    caseIdChecks.nonBlotPrefix = safeNumber(nonBlot?.[0]?.count) ?? 0;
    if ((caseIdChecks.invalidFormat ?? 0) > 0) {
      issues.push({
        type: 'data-quality',
        severity: 'high',
        message: `blotter.Case_Number has ${caseIdChecks.invalidFormat} rows that do not match BLOT-YYYY-MM-NNNN`
      });
    }
  } else {
    issues.push({ type: 'schema', severity: 'high', message: 'blotter.Case_Number column missing' });
  }

  const jsonChecks = {};
  for (const jsonCol of ['Complainant_Details', 'Respondent_Details']) {
    if (!columnNames.has(jsonCol)) continue;
    const [invalidJson] = await connection.execute(
      `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE \`${jsonCol}\` IS NOT NULL AND JSON_VALID(\`${jsonCol}\`) = 0`
    );
    jsonChecks[jsonCol] = { invalidJson: safeNumber(invalidJson?.[0]?.count) ?? 0 };
    if ((jsonChecks[jsonCol]?.invalidJson ?? 0) > 0) {
      issues.push({
        type: 'data-quality',
        severity: 'medium',
        message: `blotter.${jsonCol} contains ${jsonChecks[jsonCol].invalidJson} invalid JSON values`
      });
    }
  }

  const timeChecks = {};
  if (datetimeCol) {
    const [futureRows] = await connection.execute(
      `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE \`${datetimeCol}\` > (NOW() + INTERVAL 1 DAY)`
    );
    timeChecks.futureIncidents = safeNumber(futureRows?.[0]?.count) ?? 0;
    if ((timeChecks.futureIncidents ?? 0) > 0) {
      issues.push({
        type: 'data-quality',
        severity: 'low',
        message: `blotter.${datetimeCol} has ${timeChecks.futureIncidents} incidents in the far future`
      });
    }
  }

  const sitioReferential = { missingMaster: null };
  try {
    const [sitioTableExists] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'sitios'`,
      [databaseName]
    );
    const hasSitios = (safeNumber(sitioTableExists?.[0]?.count) ?? 0) > 0;
    if (hasSitios && columnNames.has('Location_Sitio')) {
      const [missing] = await connection.execute(
        `
        SELECT COUNT(*) as count
        FROM blotter b
        LEFT JOIN sitios s ON s.name = b.Location_Sitio
        WHERE s.name IS NULL
        `
      );
      sitioReferential.missingMaster = safeNumber(missing?.[0]?.count) ?? 0;
      if ((sitioReferential.missingMaster ?? 0) > 0) {
        issues.push({
          type: 'data-quality',
          severity: 'medium',
          message: `blotter.Location_Sitio has ${sitioReferential.missingMaster} values not present in sitios.name`
        });
      }
    }
  } catch (e) {
    issues.push({ type: 'analysis', severity: 'low', message: `Sitio referential check skipped: ${e.message}` });
  }

  return {
    tableName,
    rowCount,
    statusColumn: statusCol,
    datetimeColumn: datetimeCol,
    distributions: {
      status: statusDistribution,
      sitio: sitioDistribution,
      incidentType: incidentTypeDistribution
    },
    checks: {
      caseId: caseIdChecks,
      json: jsonChecks,
      time: timeChecks,
      sitioReferential
    },
    issues
  };
}

async function buildSchemaSummary(connection, databaseName, tables) {
  const result = {};
  for (const tableName of tables) {
    const [count, columns, indexes] = await Promise.all([
      getRowCount(connection, tableName),
      getColumns(connection, tableName),
      getIndexes(connection, tableName)
    ]);
    result[tableName] = {
      rowCount: count,
      columns: columns.map((c) => ({
        name: c.Field,
        type: c.Type,
        nullable: c.Null === 'YES',
        key: c.Key || null,
        default: c.Default ?? null
      })),
      indexes: indexes.map((i) => ({
        keyName: i.Key_name,
        columnName: i.Column_name,
        nonUnique: i.Non_unique === 1,
        seqInIndex: i.Seq_in_index
      }))
    };
  }
  const foreignKeys = await getForeignKeys(connection, databaseName);
  return { tables: result, foreignKeys };
}

function aiRequirementsSummary() {
  return {
    aiAnalytics: {
      tables: ['blotter', 'residents', 'sitios'],
      requiredFields: [
        'blotter.Case_Number',
        'blotter.Incident_Type',
        'blotter.Location_Sitio',
        'blotter.DateTime_Incident',
        'blotter.Status|blotter.status'
      ]
    },
    pythonPatrolSuggestions: {
      tables: ['blotter'],
      requiredFields: ['blotter.Location_Sitio', 'blotter.Incident_Type', 'blotter.DateTime_Incident']
    }
  };
}

async function writeReports(payload) {
  await ensureReportsDir();
  const jsonPath = path.join(REPORTS_DIR, 'db-analysis.json');
  const mdPath = path.join(REPORTS_DIR, 'db-analysis.md');

  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  const topIssues = payload.issues
    .slice()
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
    })
    .slice(0, 25);

  const md = [
    '# Database Analysis Report',
    '',
    `Generated: ${payload.generatedAt}`,
    `Database: ${payload.database.name}`,
    '',
    '## Summary',
    '',
    `- Total tables: ${payload.database.tableCount}`,
    `- Total foreign keys: ${payload.schema.foreignKeys.length}`,
    `- Top issues: ${payload.issues.length}`,
    '',
    '## Top Issues',
    '',
    markdownTable(
      topIssues.map((i) => ({
        severity: i.severity,
        type: i.type,
        message: i.message
      }))
    ) || '_None_',
    '',
    '## Blotter Quality Metrics',
    '',
    `- Rows: ${payload.blotter.rowCount}`,
    `- Status column: ${payload.blotter.statusColumn ?? '(missing)'}`,
    `- DateTime column: ${payload.blotter.datetimeColumn ?? '(missing)'}`,
    `- Invalid case IDs: ${payload.blotter.checks.caseId.invalidFormat ?? 'n/a'}`,
    '',
    '### Status Distribution',
    '',
    markdownTable(payload.blotter.distributions.status),
    '',
    '### Sitio Distribution',
    '',
    markdownTable(payload.blotter.distributions.sitio),
    '',
    '### Incident Type Distribution',
    '',
    markdownTable(payload.blotter.distributions.incidentType),
    '',
    '## AI Data Requirements',
    '',
    '```json',
    JSON.stringify(payload.aiRequirements, null, 2),
    '```',
    ''
  ].join('\n');

  await fs.writeFile(mdPath, md, 'utf8');
  return { jsonPath, mdPath };
}

async function runDbAnalysis() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    const tables = await getAllTables(connection);
    const schema = await buildSchemaSummary(connection, process.env.DB_NAME, tables);
    const blotter = tables.includes('blotter')
      ? await analyzeBlotterTable(connection, process.env.DB_NAME)
      : {
          tableName: 'blotter',
          rowCount: 0,
          statusColumn: null,
          datetimeColumn: null,
          distributions: { status: [], sitio: [], incidentType: [] },
          checks: { caseId: { total: 0, invalidFormat: null, nonBlotPrefix: null }, json: {}, time: {}, sitioReferential: {} },
          issues: [{ type: 'schema', severity: 'high', message: 'blotter table not found' }]
        };

    const issues = [...(blotter.issues ?? [])];
    if (!tables.includes('sitios')) {
      issues.push({ type: 'schema', severity: 'medium', message: 'sitios table not found (sitio validation limited)' });
    }

    const payload = {
      generatedAt: nowIso(),
      database: { name: process.env.DB_NAME, tableCount: tables.length },
      schema,
      blotter,
      aiRequirements: aiRequirementsSummary(),
      issues
    };

    const { jsonPath, mdPath } = await writeReports(payload);
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  } finally {
    await connection.end();
  }
}

runDbAnalysis().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
