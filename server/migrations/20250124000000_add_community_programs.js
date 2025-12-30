exports.up = function(knex) {
  return knex.schema.createTable('community_programs', function(table) {
    table.increments('program_id').primary();
    table.string('program_name', 255).notNullable();
    table.text('description');
    table.json('target_beneficiaries');
    table.datetime('date_posted').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('community_programs');
};
