'use strict';

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('system_assets');
  if (exists) return;

  await knex.schema.createTable('system_assets', function (table) {
    table.increments('id').primary();
    table.enu('asset_type', ['seal', 'letterhead']).notNullable().index();
    table.string('file_path', 512).notNullable();
    table.string('mime_type', 128).notNullable();
    table.string('original_name', 255).notNullable();
    table.string('uploaded_by', 50).nullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now()).index();
  });
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('system_assets');
  if (!exists) return;
  await knex.schema.dropTable('system_assets');
};
