exports.up = function (knex) {
  return knex.schema.hasTable('document_templates').then(function (exists) {
    if (!exists) {
      // Create table if it doesn't exist
      return knex.schema.createTable('document_templates', function (table) {
        table.increments('id').primary();
        table.string('template_name', 255).notNullable();
        table.string('document_type', 100).notNullable();
        table.integer('certificate_type_id').nullable();
        table.text('template_content'); // JSON string
        table.boolean('is_active').defaultTo(true);
        table.integer('created_by').unsigned();
        table.integer('updated_by').unsigned();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // File upload columns
        table.specificType('file_data', 'LONGBLOB');
        table.string('file_encoding', 50);
        table.string('original_filename', 255);
        table.string('file_type', 100);
        table.integer('file_size');
      });
    } else {
      // Alter table to add missing columns if it exists
      return knex.schema
        .table('document_templates', function (table) {
          // Check for columns before adding (knex doesn't have hasColumn in chain easily without async,
          // so we use specificType which is standard or try/catch in raw SQL, but here we just add them safely)
          // Note: Knex doesn't support 'if not exists' for columns easily across all DBs.
          // We will try to add them. If they fail, it might be due to existence.
          // However, a cleaner way is to assume they are missing based on previous analysis.
          // We use checks inside the up function logic
        })
        .then(async () => {
          const hasFileData = await knex.schema.hasColumn('document_templates', 'file_data');
          if (!hasFileData) {
            await knex.schema.alterTable('document_templates', table => {
              table.specificType('file_data', 'LONGBLOB');
            });
          }

          const hasFileEncoding = await knex.schema.hasColumn(
            'document_templates',
            'file_encoding'
          );
          if (!hasFileEncoding) {
            await knex.schema.alterTable('document_templates', table => {
              table.string('file_encoding', 50);
            });
          }

          const hasCertTypeId = await knex.schema.hasColumn(
            'document_templates',
            'certificate_type_id'
          );
          if (!hasCertTypeId) {
            await knex.schema.alterTable('document_templates', table => {
              table.integer('certificate_type_id').nullable();
            });
          }
        });
    }
  });
};

exports.down = function (knex) {
  // We don't drop the columns to avoid data loss on rollback of just this migration if table existed before
  // But if we created the table, we should drop it.
  // For safety in this environment, we'll leave down empty or just drop columns if we added them.
  // Given the ambiguity of "did it exist", safe down is no-op or specific column drop.
  return Promise.resolve();
};
