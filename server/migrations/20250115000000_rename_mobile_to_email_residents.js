exports.up = function (knex) {
  return knex.schema
    .alterTable('residents', function (table) {
      // Rename Mobile_Number column to Email
      table.renameColumn('Mobile_Number', 'Email');
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('residents', function (table) {
      // Revert: Rename Email column back to Mobile_Number
      table.renameColumn('Email', 'Mobile_Number');
    });
};
