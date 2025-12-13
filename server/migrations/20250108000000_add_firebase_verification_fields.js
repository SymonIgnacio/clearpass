exports.up = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table.boolean('email_verified').defaultTo(false);
      table.boolean('phone_verified').defaultTo(false);
      table.string('firebase_uid', 255).nullable();
      table.timestamp('verified_at').nullable();
      table.string('resident_id', 50).nullable();
      table.index('firebase_uid');
      table.index('resident_id');
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table.dropIndex('firebase_uid');
      table.dropIndex('resident_id');
      table.dropColumn('email_verified');
      table.dropColumn('phone_verified');
      table.dropColumn('firebase_uid');
      table.dropColumn('verified_at');
      table.dropColumn('resident_id');
    });
};
