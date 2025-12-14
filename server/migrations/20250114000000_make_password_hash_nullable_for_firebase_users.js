exports.up = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      // Make password_hash nullable for Firebase users
      table.dropColumn('password_hash');
      table.string('password_hash', 255).nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      // Restore password_hash as NOT NULL
      table.dropColumn('password_hash');
      table.string('password_hash', 255).notNullable();
    });
};
