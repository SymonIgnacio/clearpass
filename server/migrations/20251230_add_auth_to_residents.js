exports.up = async function (knex) {
  const hasUsername = await knex.schema.hasColumn('residents', 'username');
  const hasPassword = await knex.schema.hasColumn('residents', 'password_hash');
  const hasStatus = await knex.schema.hasColumn('residents', 'account_status');

  await knex.schema.alterTable('residents', function (table) {
    // Add authentication columns for local login
    if (!hasUsername) {
      table.string('username', 255).unique().nullable();
    }
    if (!hasPassword) {
      table.string('password_hash', 255).nullable();
    }
    if (!hasStatus) {
      table
        .enu('account_status', ['Unregistered', 'Unverified', 'Verified'])
        .defaultTo('Unregistered');
    }
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('residents', function (table) {
    // Remove authentication columns
    table.dropColumn('username');
    table.dropColumn('password_hash');
    table.dropColumn('account_status');
  });
};
