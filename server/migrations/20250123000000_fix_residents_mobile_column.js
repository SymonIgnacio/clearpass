exports.up = async function (knex) {
  const hasMobile = await knex.schema.hasColumn('residents', 'Mobile_Number');
  if (!hasMobile) {
    await knex.schema.alterTable('residents', function (table) {
      // Add Mobile_Number column only if it doesn't exist
      table.string('Mobile_Number', 20).nullable().comment('Critical for SMS OTP');
    });
  }
};

exports.down = function (knex) {
  return knex.schema.alterTable('residents', function (table) {
    table.dropColumn('Mobile_Number');
  });
};
