exports.up = async function (knex) {
  const hasCommunityPrograms = await knex.schema.hasTable('community_programs');
  if (!hasCommunityPrograms) {
    await knex.schema.createTable('community_programs', function (table) {
      table.increments('id').primary();
      table.string('program_name', 255).notNullable();
      table.text('description');
      table.date('program_date').notNullable();
      table.integer('sitio_id').unsigned();
      table.json('target_beneficiaries');
      table.enum('status', ['Planned', 'Ongoing', 'Completed', 'Cancelled']).defaultTo('Planned');
      table.string('organizer', 100);
      table.decimal('budget_allocated', 10, 2).defaultTo(0);
      table.text('notes');
      table.string('created_by', 50);
      table.timestamps(true, true);

      table.foreign('sitio_id').references('id').inTable('sitios');
      table.index(['program_date', 'status']);
    });
  }

  const hasParticipants = await knex.schema.hasTable('program_participants');
  if (!hasParticipants) {
    await knex.schema.createTable('program_participants', function (table) {
      table.increments('id').primary();
      table.integer('program_id').unsigned().notNullable();
      table.string('resident_id', 50).notNullable();
      table.timestamp('joined_at').defaultTo(knex.fn.now());

      table
        .foreign('program_id')
        .references('id')
        .inTable('community_programs')
        .onDelete('CASCADE');
      table
        .foreign('resident_id')
        .references('Resident_ID')
        .inTable('residents')
        .onDelete('CASCADE');
      table.unique(['program_id', 'resident_id']);
    });
  }
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('program_participants')
    .then(() => knex.schema.dropTableIfExists('community_programs'));
};
