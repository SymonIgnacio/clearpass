'use strict';

/**
 * THEMIS RBAC: Migration to standardize user roles to numeric values (0-5)
 * Ensures consistency between database and application code
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Ensure role column is TINYINT with proper constraints
    table.tinyint('role').notNullable().defaultTo(5).comment('THEMIS Role ID: 0=IT Admin, 1=Captain, 2=Secretary, 3=Clerk, 4=Blotter Officer, 5=Resident').alter();

    // Add PIN column for ResidentID + PIN authentication (THEMIS requirement)
    table.string('pin', 6).nullable().comment('6-digit PIN for ResidentID + PIN authentication');

    // Add index for performance
    table.index('role');
  }).then(() => {
    // Update any existing string roles to numeric values
    return knex('users').update({
      role: knex.raw(`
        CASE
          WHEN role = 'admin' THEN 0
          WHEN role = 'captain' THEN 1
          WHEN role = 'secretary' THEN 2
          WHEN role = 'clerk' THEN 3
          WHEN role = 'blotter_officer' THEN 4
          ELSE 5 -- Default to Resident
        END
      `)
    });
  }).then(() => {
    // Add certificate status transitions (THEMIS requirement)
    return knex.schema.alterTable('certificates_log', function(table) {
      table.enu('status', ['PENDING', 'APPROVED_FOR_ISSUANCE', 'COMPLETED']).defaultTo('PENDING').comment('THEMIS Certificate Status: PENDING -> APPROVED_FOR_ISSUANCE -> COMPLETED');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Revert to original ENUM (if needed for rollback)
    table.enu('role', ['admin', 'captain', 'secretary', 'clerk', 'resident']).defaultTo('resident').alter();
  });
};
