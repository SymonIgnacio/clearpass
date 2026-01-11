exports.up = async function (knex) {
  const hasResidentDocs = await knex.schema.hasTable('resident_documents');
  if (hasResidentDocs) {
    await knex.schema.alterTable('resident_documents', (table) => {
      table.string('encryption_alg', 32);
      table.integer('encryption_version').unsigned();
      table.string('encryption_iv', 64);
      table.string('encryption_tag', 64);
      table.timestamp('disposed_at').nullable().defaultTo(null);
      table.string('disposed_by', 50);
      table.text('disposal_reason');
    });
  }

  const hasAppDocs = await knex.schema.hasTable('application_documents');
  if (hasAppDocs) {
    await knex.schema.alterTable('application_documents', (table) => {
      table.string('encryption_alg', 32);
      table.integer('encryption_version').unsigned();
      table.string('encryption_iv', 64);
      table.string('encryption_tag', 64);
      table.timestamp('disposed_at').nullable().defaultTo(null);
      table.string('disposed_by', 50);
      table.text('disposal_reason');
    });
  }
};

exports.down = async function (knex) {
  const hasResidentDocs = await knex.schema.hasTable('resident_documents');
  if (hasResidentDocs) {
    await knex.schema.alterTable('resident_documents', (table) => {
      table.dropColumn('encryption_alg');
      table.dropColumn('encryption_version');
      table.dropColumn('encryption_iv');
      table.dropColumn('encryption_tag');
      table.dropColumn('disposed_at');
      table.dropColumn('disposed_by');
      table.dropColumn('disposal_reason');
    });
  }

  const hasAppDocs = await knex.schema.hasTable('application_documents');
  if (hasAppDocs) {
    await knex.schema.alterTable('application_documents', (table) => {
      table.dropColumn('encryption_alg');
      table.dropColumn('encryption_version');
      table.dropColumn('encryption_iv');
      table.dropColumn('encryption_tag');
      table.dropColumn('disposed_at');
      table.dropColumn('disposed_by');
      table.dropColumn('disposal_reason');
    });
  }
};
