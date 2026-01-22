exports.up = async function (knex) {
  const hasRequests = await knex.schema.hasTable('blotter_requests');
  if (!hasRequests) {
    await knex.schema.createTable('blotter_requests', function (table) {
      table.increments('id').primary();
      table.string('complainant_resident_id', 50).notNullable();
      table.string('respondent_resident_id', 50).nullable();
      table.string('respondent_name', 200).nullable();
      table
        .enu('incident_type', [
          'Physical Injury',
          'Unjust Vexation',
          'Grave Threats',
          'Alarming and Scandal',
          'Theft (Petty)',
          'Malicious Mischief',
          'Estafa (Swindling)',
          'Trespassing',
          'Collection of Sum of Money',
          'Ejectment',
          'Boundary Dispute',
          'Family Dispute',
          'Curfew Violation',
          'Noise Barrage',
          'Illegal Parking',
          'Waste Management',
          'Stray Animals',
        ])
        .notNullable();
      table.datetime('incident_datetime').notNullable();
      table
        .enu('location_sitio', ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'])
        .notNullable();
      table.text('location_details');
      table.text('description_text').notNullable();
      table.json('attachments_json');
      table
        .enu('status', ['pending_review', 'for_validation', 'approved', 'rejected'])
        .notNullable()
        .defaultTo('pending_review');
      table.text('officer_notes');
      table.string('approved_blotter_case_number', 50).nullable();
      table.integer('validation_assigned_officer_id').nullable();
      table.timestamp('validation_started_at').nullable();
      table.timestamp('validation_due_at').nullable();
      table.json('validation_notes_json');
      table.json('validation_evidence_json');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.foreign('complainant_resident_id').references('Resident_ID').inTable('residents');
      table.foreign('respondent_resident_id').references('Resident_ID').inTable('residents');
      table.foreign('approved_blotter_case_number').references('Case_Number').inTable('blotter');
      table.index(['status', 'created_at']);
      table.index('complainant_resident_id');
      table.index('validation_assigned_officer_id');
    });
  } else {
    const hasCol = await knex.schema.hasColumn(
      'blotter_requests',
      'validation_assigned_officer_id'
    );
    if (hasCol) {
      await knex.schema.alterTable('blotter_requests', function (table) {
        table.integer('validation_assigned_officer_id').nullable().alter();
      });
    }
  }

  const hasAudits = await knex.schema.hasTable('blotter_request_audits');
  if (!hasAudits) {
    await knex.schema.createTable('blotter_request_audits', function (table) {
      table.increments('id').primary();
      table.integer('request_id').notNullable();
      table.integer('actor_user_id').nullable();
      table
        .enu('actor_role', ['admin', 'captain', 'secretary', 'clerk', 'tanod', 'resident'])
        .nullable();
      table
        .enu('action', [
          'submitted',
          'assigned_validation',
          'added_note',
          'requested_info',
          'resident_response',
          'approved',
          'rejected',
        ])
        .notNullable();
      table.text('message_text');
      table.json('attachments_json');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('request_id');
      table.index('created_at');
    });
  }
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('blotter_request_audits')
    .dropTableIfExists('blotter_requests');
};
