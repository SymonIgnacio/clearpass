exports.up = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    // Add authentication columns for local login
    table.string('username', 255).unique().nullable();
    table.string('password_hash', 255).nullable();
    table.enu('account_status', ['Unregistered', 'Unverified', 'Verified']).defaultTo('Unregistered');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    // Remove authentication columns
    table.dropColumn('username');
    table.dropColumn('password_hash');
    table.dropColumn('account_status');
  });
};
