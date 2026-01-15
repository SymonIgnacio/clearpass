'use strict';

/**
 * RBAC: Migration to standardize legacy string roles to DB-aligned numeric IDs.
 * Final mapping is enforced by later role integrity migrations.
 */

exports.up = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table
        .integer('role')
        .unsigned()
        .notNullable()
        .defaultTo(12)
        .comment('Role ID aligned to roles.id')
        .alter();

      // Add PIN column for ResidentID + PIN authentication (THEMIS requirement)
      table.string('pin', 6).nullable().comment('6-digit PIN for ResidentID + PIN authentication');
    })
    .then(() => {
      // Update any existing string roles to numeric values
      return knex('users').update({
        role: knex.raw(`
        CASE
          WHEN role = 'admin' THEN 1
          WHEN role = 'captain' THEN 2
          WHEN role = 'secretary' THEN 3
          WHEN role = 'clerk' THEN 4
          WHEN role = 'tanod' THEN 6
          WHEN role = 'blotter_officer' THEN 6
          ELSE 12
        END
      `),
      });
    });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('role').unsigned().notNullable().defaultTo(12).alter();
  });
};
