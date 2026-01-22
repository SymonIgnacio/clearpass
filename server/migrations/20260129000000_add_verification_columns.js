'use strict';

exports.up = async function (knex) {
  if (!(await knex.schema.hasColumn('users', 'email_verified'))) {
    await knex.schema.alterTable('users', function (table) {
      table.boolean('email_verified').defaultTo(false).notNullable();
    });
  }
  if (!(await knex.schema.hasColumn('users', 'phone_verified'))) {
    await knex.schema.alterTable('users', function (table) {
      table.boolean('phone_verified').defaultTo(false).notNullable();
    });
  }
  if (!(await knex.schema.hasColumn('users', 'verified_at'))) {
    await knex.schema.alterTable('users', function (table) {
      table.timestamp('verified_at').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('vulnerabilities', 'validation_status'))) {
    await knex.schema.alterTable('vulnerabilities', function (table) {
      table.enu('validation_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    });
  }

  if (!(await knex.schema.hasColumn('resident_documents', 'mime_type'))) {
    await knex.schema.alterTable('resident_documents', function (table) {
      table.string('mime_type', 100).nullable();
    });
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasColumn('users', 'email_verified')) {
    await knex.schema.alterTable('users', function (table) {
      table.dropColumn('email_verified');
    });
  }
  if (await knex.schema.hasColumn('users', 'phone_verified')) {
    await knex.schema.alterTable('users', function (table) {
      table.dropColumn('phone_verified');
    });
  }
  if (await knex.schema.hasColumn('users', 'verified_at')) {
    await knex.schema.alterTable('users', function (table) {
      table.dropColumn('verified_at');
    });
  }

  if (await knex.schema.hasColumn('vulnerabilities', 'validation_status')) {
    await knex.schema.alterTable('vulnerabilities', function (table) {
      table.dropColumn('validation_status');
    });
  }

  if (await knex.schema.hasColumn('resident_documents', 'mime_type')) {
    await knex.schema.alterTable('resident_documents', function (table) {
      table.dropColumn('mime_type');
    });
  }
};
