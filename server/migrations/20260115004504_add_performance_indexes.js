/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasIndex = async (tableName, indexName) => {
    try {
      const [rows] = await knex.raw(`SHOW INDEX FROM ?? WHERE Key_name = ?`, [tableName, indexName]);
      return rows.length > 0;
    } catch (e) {
      return false;
    }
  };

  // Residents table indexes
  if (!(await hasIndex('residents', 'idx_residents_name'))) {
    await knex.schema.table('residents', function(table) {
      table.index(['First_Name', 'Last_Name'], 'idx_residents_name');
    });
  }
  if (!(await hasIndex('residents', 'idx_residents_status'))) {
    await knex.schema.table('residents', function(table) {
      table.index(['Residency_Status'], 'idx_residents_status');
    });
  }

  // Blotter table indexes
  if (!(await hasIndex('blotter', 'idx_blotter_status'))) {
    await knex.schema.table('blotter', function(table) {
      table.index(['Status'], 'idx_blotter_status');
    });
  }
  if (!(await hasIndex('blotter', 'idx_blotter_incident_type'))) {
    await knex.schema.table('blotter', function(table) {
      table.index(['Incident_Type'], 'idx_blotter_incident_type');
    });
  }

  // Certificates log indexes
  if (!(await hasIndex('certificates_log', 'idx_certificates_resident'))) {
    await knex.schema.table('certificates_log', function(table) {
      table.index(['resident_id'], 'idx_certificates_resident');
    });
  }
  if (!(await hasIndex('certificates_log', 'idx_certificates_date'))) {
    await knex.schema.table('certificates_log', function(table) {
      table.index(['date_issued'], 'idx_certificates_date');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // We try to drop them, ignoring errors if they don't exist
  const dropIndexSafe = async (tableName, indexName) => {
    try {
      await knex.schema.table(tableName, function(table) {
        table.dropIndex([], indexName);
      });
    } catch (e) {
      // Ignore
    }
  };

  await dropIndexSafe('certificates_log', 'idx_certificates_resident');
  await dropIndexSafe('certificates_log', 'idx_certificates_date');
  await dropIndexSafe('blotter', 'idx_blotter_status');
  await dropIndexSafe('blotter', 'idx_blotter_incident_type');
  await dropIndexSafe('residents', 'idx_residents_name');
  await dropIndexSafe('residents', 'idx_residents_status');
};
