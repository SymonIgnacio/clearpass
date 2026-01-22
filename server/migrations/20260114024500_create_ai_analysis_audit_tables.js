exports.up = async function up(knex) {
  await knex.schema.createTable('ai_analysis_runs', function createTable(table) {
    table.string('id', 36).primary();
    table.string('endpoint', 160).notNullable();
    table.integer('user_id').nullable();
    table.integer('duration_ms').nullable();
    table.decimal('confidence_score', 5, 4).nullable();
    table.json('request_json').nullable();
    table.json('evidence_json').nullable();
    table.json('output_json').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['endpoint', 'created_at']);
    table.index(['user_id', 'created_at']);
  });

  await knex.schema.createTable('ai_analysis_sources', function createTable(table) {
    table.bigIncrements('id').primary();
    table.string('run_id', 36).notNullable();
    table.string('source_type', 60).notNullable();
    table.string('source_key', 255).nullable();
    table.boolean('verified').notNullable().defaultTo(false);
    table.json('details_json').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['run_id']);
    table.index(['source_type']);
    table.foreign('run_id').references('id').inTable('ai_analysis_runs').onDelete('CASCADE');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('ai_analysis_sources');
  await knex.schema.dropTableIfExists('ai_analysis_runs');
};
