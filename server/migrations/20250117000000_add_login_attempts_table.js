exports.up = function (knex) {
  return knex.schema.createTable('login_attempts', function (table) {
    table.increments('id').primary();
    table.string('username', 50).notNullable();
    table.string('ip_address', 45); // IPv4/IPv6 compatible
    table.boolean('success').defaultTo(true);
    table.string('reason', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('username');
    table.index('ip_address');
    table.index('success');
    table.index('created_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('login_attempts');
};
