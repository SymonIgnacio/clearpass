exports.up = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    // Ensure all required authentication columns exist
    table.string('username', 255).unique().nullable();
    table.string('password_hash', 255).nullable();
    table.enu('account_status', ['Unregistered', 'Unverified', 'Verified']).defaultTo('Unregistered');
    table.text('verification_file').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    // Remove authentication columns if rolling back
    table.dropColumn('username');
    table.dropColumn('password_hash');
    table.dropColumn('account_status');
    table.dropColumn('verification_file');
  });
};
