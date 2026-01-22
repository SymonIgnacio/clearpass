exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('residents', 'verification_file');
  if (!hasColumn) {
    await knex.schema.table('residents', function (table) {
      table.text('verification_file').nullable();
    });
  }
};

exports.down = function (knex) {
  return knex.schema.table('residents', function (table) {
    table.dropColumn('verification_file');
  });
};
