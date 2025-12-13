'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('resident_signup_requests', function(table) {
    table.string('request_id', 50).primary();
    table.string('resident_id', 50).notNullable(); // Links to residents table
    table.string('email', 100);
    table.string('mobile_number', 20);
    table.string('username', 50).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 200).notNullable();
    table.string('proof_of_residency_path', 255).notNullable(); // File path for uploaded document
    table.string('proof_type', 50).notNullable(); // electric_bill, water_bill, cedula, etc.
    table.text('notes'); // Additional notes from resident
    table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
    table.timestamp('reviewed_at');
    table.string('reviewed_by', 50); // Officer who reviewed
    table.text('review_notes'); // Officer review notes
    table.timestamp('approved_at');
    table.string('created_user_id', 50); // User ID created upon approval

    // Indexes
    table.index(['resident_id'], 'idx_resident_signup_resident');
    table.index(['status'], 'idx_resident_signup_status');
    table.index(['submitted_at'], 'idx_resident_signup_submitted');

    // Foreign key
    table.foreign('resident_id').references('Resident_ID').inTable('residents');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('resident_signup_requests');
};
