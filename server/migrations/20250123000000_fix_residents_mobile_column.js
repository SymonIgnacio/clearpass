exports.up = function (knex) {
  return knex.schema.alterTable('residents', function (table) {
    // Add Mobile_Number column only if it doesn't exist
    table.string('Mobile_Number', 20).nullable().comment('Critical for SMS OTP');
  }).then(() => {
    // Add index separately
    return knex.schema.alterTable('residents', function (table) {
      table.index('Mobile_Number');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('residents', function (table) {
    table.dropIndex('Mobile_Number');
    table.dropColumn('Mobile_Number');
  });
};
