'use strict';

module.exports = {
  async up(knex) {
  // Add BLOB columns for storing files directly in database
    await knex.schema.alterTable('document_templates', (table) => {
      table.specificType('file_data', 'MEDIUMBLOB').nullable().comment('Binary file data stored in database (16MB limit)');
      table.string('file_encoding', 50).nullable().comment('File encoding type (e.g., base64)');
      table.index(['is_active', 'document_type'], 'idx_templates_active_type');
    });

    console.log('✅ Added BLOB columns to document_templates table');
  },

  async down(knex) {
    // Remove BLOB columns
    await knex.schema.alterTable('document_templates', (table) => {
      table.dropColumn('file_data');
      table.dropColumn('file_encoding');
      table.dropIndex(['is_active', 'document_type'], 'idx_templates_active_type');
    });

    console.log('✅ Removed BLOB columns from document_templates table');
  }
};
