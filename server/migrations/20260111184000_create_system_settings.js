'use strict';

exports.up = async function (knex) {
  const has = await knex.schema.hasTable('system_settings');
  if (has) return;

  await knex.schema.createTable('system_settings', table => {
    table.increments('id').primary();
    table.string('barangay_name', 200).nullable();
    table.string('captain_name', 200).nullable();
    table.string('secretary_name', 200).nullable();
    table.string('contact_number', 50).nullable();
    table.string('email', 100).nullable();
    table.string('address', 255).nullable();
    table.string('office_hours', 100).nullable();
    table.decimal('certificate_fee', 10, 2).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const has = await knex.schema.hasTable('system_settings');
  if (!has) return;
  await knex.schema.dropTable('system_settings');
};
