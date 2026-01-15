exports.up = async function(knex) {
  const hasApps = await knex.schema.hasTable('resident_applications');
  if (!hasApps) {
    await knex.schema.createTable('resident_applications', function(table) {
      table.string('application_id', 50).primary();
      table.string('first_name', 100).notNullable();
      table.string('middle_name', 100);
      table.string('last_name', 100).notNullable();
      table.string('suffix', 20);
      table.date('birthdate').notNullable();
      table.enum('gender', ['Male', 'Female', 'Other']).defaultTo('Male');
      table.enum('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Divorced']).defaultTo('Single');
      table.string('occupation', 100);
      table.decimal('income_estimate', 10, 2).defaultTo(0);
      table.string('email', 255).notNullable();
      table.string('mobile_number', 20);
      table.text('street_address').notNullable();
      table.string('sitio', 100).notNullable();
      table.enum('voter_status', ['Registered', 'Non-Registered']).defaultTo('Non-Registered');
      table.boolean('is_4ps').defaultTo(false);
      table.boolean('is_pwd').defaultTo(false);
      table.boolean('is_solo_parent').defaultTo(false);
      table.boolean('is_out_of_school_youth').defaultTo(false);
      table.string('disability_type', 255);
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
      table.string('temp_password', 255);
      table.text('rejection_reason');
      table.string('reviewed_by', 50);
      table.timestamp('reviewed_at');
      table.timestamps(true, true);
      
      table.index(['email']);
      table.index(['status']);
      table.index(['created_at']);
    });
  }

  const hasAppDocs = await knex.schema.hasTable('application_documents');
  if (!hasAppDocs) {
    await knex.schema.createTable('application_documents', function(table) {
      table.increments('id').primary();
      table.string('application_id', 50).notNullable();
      table.string('document_type', 50).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_name', 255).notNullable();
      table.enum('verification_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
      table.text('verification_notes');
      table.string('verified_by', 50);
      table.timestamp('verified_at');
      table.timestamps(true, true);
      
      table.foreign('application_id').references('application_id').inTable('resident_applications').onDelete('CASCADE');
      table.index(['application_id']);
      table.index(['document_type']);
      table.index(['verification_status']);
    });
  }

  const hasResDocs = await knex.schema.hasTable('resident_documents');
  if (!hasResDocs) {
    await knex.schema.createTable('resident_documents', function(table) {
      table.increments('id').primary();
      table.string('resident_id', 50).notNullable();
      table.string('document_type', 50).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_name', 255).notNullable();
      table.enum('verification_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
      table.text('verification_notes');
      table.string('verified_by', 50);
      table.timestamp('verified_at');
      table.timestamps(true, true);
      
      table.foreign('resident_id').references('Resident_ID').inTable('residents').onDelete('CASCADE');
      table.index(['resident_id']);
      table.index(['document_type']);
      table.index(['verification_status']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('resident_documents')
    .dropTableIfExists('application_documents')
    .dropTableIfExists('resident_applications');
};