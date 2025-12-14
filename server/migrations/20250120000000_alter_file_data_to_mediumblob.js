'use strict';

module.exports = {
  async up(knex) {
    // Alter the file_data column to MEDIUMBLOB to support larger files (16MB instead of 65KB)
    await knex.raw('ALTER TABLE document_templates MODIFY COLUMN file_data MEDIUMBLOB');

    console.log('✅ Changed file_data column to MEDIUMBLOB');
  },

  async down(knex) {
    // Revert back to regular BLOB
    await knex.raw('ALTER TABLE document_templates MODIFY COLUMN file_data BLOB');

    console.log('✅ Reverted file_data column to BLOB');
  }
};
