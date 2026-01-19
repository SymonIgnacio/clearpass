/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add file_data column to application_documents
  await knex.schema.alterTable('application_documents', (table) => {
    table.specificType('file_data', 'LONGBLOB').nullable();
  });

  // Add file_data column to resident_documents
  await knex.schema.alterTable('resident_documents', (table) => {
    table.specificType('file_data', 'LONGBLOB').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('application_documents', (table) => {
    table.dropColumn('file_data');
  });

  await knex.schema.alterTable('resident_documents', (table) => {
    table.dropColumn('file_data');
  });
};
