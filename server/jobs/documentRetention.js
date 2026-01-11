const fs = require('fs');
const path = require('path');

const { resolveAndValidateUploadedDocumentPath } = require('../utils/documentStorage');

const parseRetentionDays = () => {
  const raw = process.env.DOCUMENT_RETENTION_DAYS || '365';
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 365;
  return n;
};

const runDocumentRetention = async (db) => {
  const days = parseRetentionDays();

  const disposeTable = async (tableName, idColumn = 'id') => {
    const [rows] = await db.execute(
      `
      SELECT ${idColumn} as id, file_path
      FROM ${tableName}
      WHERE disposed_at IS NULL
        AND verification_status IN ('verified', 'rejected')
        AND created_at < (NOW() - INTERVAL ? DAY)
      LIMIT 500
      `,
      [days]
    );

    for (const row of rows || []) {
      const absolute = resolveAndValidateUploadedDocumentPath(row.file_path);
      if (absolute) {
        try {
          await fs.promises.unlink(absolute);
        } catch {}
        try {
          await fs.promises.unlink(`${absolute}.enc`);
        } catch {}
      }

      await db.execute(
        `
        UPDATE ${tableName}
        SET disposed_at = NOW(),
            disposed_by = ?,
            disposal_reason = ?,
            file_path = NULL,
            encryption_alg = NULL,
            encryption_version = NULL,
            encryption_iv = NULL,
            encryption_tag = NULL
        WHERE ${idColumn} = ?
      `,
        ['system', 'retention', row.id]
      );
    }
  };

  await disposeTable('resident_documents', 'id');
  await disposeTable('application_documents', 'id');
};

const startDocumentRetentionScheduler = (db) => {
  const enabled = process.env.DOCUMENT_RETENTION_ENABLED === 'true';
  if (!enabled) return null;

  const runSafe = async () => {
    try {
      await runDocumentRetention(db);
    } catch {}
  };

  runSafe();
  return setInterval(runSafe, 24 * 60 * 60 * 1000);
};

module.exports = { runDocumentRetention, startDocumentRetentionScheduler };

