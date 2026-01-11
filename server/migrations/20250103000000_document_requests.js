'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('document_requests', function(table) {
    table.string('request_id', 50).primary();
    table.string('resident_id', 50).notNullable();
    table.string('document_type', 100).notNullable();
    table.enu('status', ['pending', 'approved', 'rejected', 'completed']).defaultTo('pending');
    table.json('request_data').notNullable(); // User input data
    table.json('resident_data').notNullable(); // Auto-filled from database
    table.json('approval_data'); // Approval details
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at').nullable().defaultTo(null);
    table.string('approved_by', 50);
    table.timestamp('valid_until').nullable().defaultTo(null);
    table.text('qr_code');
    table.string('control_number', 100);

    // Indexes
    table.index(['resident_id'], 'idx_document_requests_resident');
    table.index(['document_type'], 'idx_document_requests_type');
    table.index(['status'], 'idx_document_requests_status');
    table.index(['created_at'], 'idx_document_requests_created');
    table.index(['control_number'], 'idx_document_requests_control');

    // Foreign key
    table.foreign('resident_id').references('Resident_ID').inTable('residents');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('document_requests');
};
