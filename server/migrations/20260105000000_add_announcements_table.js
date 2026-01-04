exports.up = function(knex) {
  return knex.schema.createTable('announcements', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.string('category', 50).defaultTo('general');
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.datetime('expires_at').nullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('created_by').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.index(['is_active', 'expires_at']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('announcements');
};
