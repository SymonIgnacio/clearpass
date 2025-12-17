'use strict';

/**
 * THEMIS CLEARPASS: Migration to implement 6-tier ClearPass hierarchy (1-6)
 * Updates roles from 0-5 to 1-6 and ensures proper schema for ClearPass protocol
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Update role column to use THEMIS CLEARPASS hierarchy (1-6)
    table.tinyint('role').notNullable().defaultTo(4).comment('THEMIS CLEARPASS Role ID: 1=IT Admin, 2=Clerk, 3=Blotter Officer, 4=Resident, 5=Captain, 6=Secretary').alter();

    // Ensure resident_id column exists (for linking users to resident profiles)
    if (!table.hasColumn('resident_id')) {
      table.string('resident_id', 50).nullable().comment('Links user to resident profile for ClearPass validation');
      table.foreign('resident_id').references('Resident_ID').inTable('residents').onDelete('SET NULL');
    }

    // Ensure pin_code column exists (for Role 4 Resident login)
    if (!table.hasColumn('pin_code')) {
      table.string('pin_code', 6).nullable().comment('6-digit PIN for ResidentID + PIN authentication');
    }

    // Add indexes for performance
    table.index(['role', 'resident_id']);
    table.index('pin_code');
  }).then(() => {
    // Update existing roles from old system (0-5) to new THEMIS hierarchy (1-6)
    return knex('users').update({
      role: knex.raw(`
        CASE
          WHEN role = 0 THEN 1  -- IT Admin (was 0, now 1)
          WHEN role = 1 THEN 5  -- Captain (was 1, now 5)
          WHEN role = 2 THEN 6  -- Secretary (was 2, now 6)
          WHEN role = 3 THEN 2  -- Clerk (was 3, now 2)
          WHEN role = 4 THEN 3  -- Blotter Officer (was 4, now 3)
          WHEN role = 5 THEN 4  -- Resident (was 5, now 4)
          ELSE 4                -- Default to Resident
        END
      `)
    });
  }).then(() => {
    // Ensure blotter table has required fields for ClearPass validation
    return knex.schema.alterTable('blotter', function(table) {
      // Ensure respondent_id links to residents for ClearPass checks
      if (!table.hasColumn('respondent_id')) {
        table.string('respondent_id', 50).nullable().comment('Resident ID for ClearPass validation');
        table.foreign('respondent_id').references('Resident_ID').inTable('residents').onDelete('SET NULL');
      }

      // Ensure hearing_count and missed_hearings for ClearPass logic
      if (!table.hasColumn('hearing_count')) {
        table.integer('hearing_count').defaultTo(0).comment('Number of hearings scheduled');
      }
      if (!table.hasColumn('missed_hearings')) {
        table.integer('missed_hearings').defaultTo(0).comment('Number of missed hearings (ClearPass blocks at 3+)');
      }

      // Ensure status uses proper enum for ClearPass checks
      table.enu('status', ['Pending', 'Active', 'Resolved', 'Dismissed']).defaultTo('Pending').comment('Case status for ClearPass validation').alter();
    });
  }).then(() => {
    // Create clearance_requests table for structured clearance workflow
    return knex.schema.createTable('clearance_requests', function(table) {
      table.increments('id').primary();
      table.string('request_id', 50).unique().notNullable();
      table.string('resident_id', 50).notNullable().comment('Resident requesting clearance');
      table.string('purpose', 500).notNullable();
      table.enu('status', ['pending', 'approved', 'rejected', 'issued']).defaultTo('pending');
      table.integer('requested_by').unsigned().nullable().comment('User ID who requested');
      table.integer('approved_by').unsigned().nullable().comment('User ID who approved');
      table.integer('issued_by').unsigned().nullable().comment('Clerk ID who issued');
      table.timestamp('requested_at').defaultTo(knex.fn.now());
      table.timestamp('approved_at').nullable();
      table.timestamp('issued_at').nullable();
      table.text('notes').nullable();
      table.timestamps(true, true);

      // Foreign keys
      table.foreign('resident_id').references('Resident_ID').inTable('residents').onDelete('CASCADE');
      table.foreign('requested_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('issued_by').references('id').inTable('users').onDelete('SET NULL');

      // Indexes
      table.index(['resident_id', 'status']);
      table.index(['requested_by', 'status']);
      table.index('request_id');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('clearance_requests')
    .then(() => {
      return knex.schema.alterTable('blotter', function(table) {
        table.dropForeign(['respondent_id']);
        table.dropColumn('respondent_id');
        table.dropColumn('hearing_count');
        table.dropColumn('missed_hearings');
      });
    }).then(() => {
      return knex.schema.alterTable('users', function(table) {
        table.dropForeign(['resident_id']);
        table.dropColumn('resident_id');
        table.dropColumn('pin_code');
        // Revert to old role system
        table.tinyint('role').notNullable().defaultTo(5).comment('Legacy Role ID: 0=IT Admin, 1=Captain, 2=Secretary, 3=Clerk, 4=Blotter Officer, 5=Resident').alter();
      });
    });
};
