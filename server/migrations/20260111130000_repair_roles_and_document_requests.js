'use strict';

exports.up = async function (knex) {
  const hasRoles = await knex.schema.hasTable('roles');
  if (hasRoles) {
    const existing = await knex('roles').select('id').where({ id: 6 }).first();
    if (!existing) {
      await knex('roles').insert({
        id: 6,
        role_name: 'Blotter Officer',
        description: 'Handles blotter cases and incident reports',
        hierarchy_level: 50,
        permissions: JSON.stringify({
          blotter: { read: true, write: true },
          residents: { read: true },
          documents: { read: true },
        }),
        is_active: 1,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  const hasResidents = await knex.schema.hasTable('residents');
  const hasDocumentRequests = await knex.schema.hasTable('document_requests');
  if (!hasDocumentRequests) {
    await knex.schema.createTable('document_requests', function (table) {
      table.string('request_id', 50).primary();
      table.string('resident_id', 50).notNullable();
      table.string('document_type', 100).notNullable();
      table
        .enu('status', ['pending', 'approved', 'rejected', 'completed'])
        .notNullable()
        .defaultTo('pending');
      table.json('request_data').notNullable();
      table.json('resident_data').notNullable();
      table.json('approval_data');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('approved_at').nullable();
      table.string('approved_by', 50);
      table.timestamp('valid_until').nullable();
      table.text('qr_code');
      table.string('control_number', 100);

      table.index(['resident_id'], 'idx_document_requests_resident');
      table.index(['document_type'], 'idx_document_requests_type');
      table.index(['status'], 'idx_document_requests_status');
      table.index(['created_at'], 'idx_document_requests_created');
      table.index(['control_number'], 'idx_document_requests_control');

      if (hasResidents) {
        table.foreign('resident_id').references('Resident_ID').inTable('residents');
      }
    });
  }
};

exports.down = async function () {
  return;
};
