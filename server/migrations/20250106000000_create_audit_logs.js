/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.increments('id').primary();
    table.string('event_type', 50).notNullable().index();
    table.string('user_id', 50).nullable().index();
    table.string('user_role', 20).nullable().index();
    table.string('ip_address', 45).nullable(); // IPv6 support
    table.text('user_agent').nullable();
    table.string('resource', 255).nullable().index();
    table.string('action', 20).nullable().index();
    table.enum('result', ['SUCCESS', 'FAILED', 'ERROR']).defaultTo('SUCCESS').index();
    table.json('details').nullable();
    table.string('session_id', 128).nullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now()).index();
    
    // Indexes for common queries
    table.index(['event_type', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['result', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};