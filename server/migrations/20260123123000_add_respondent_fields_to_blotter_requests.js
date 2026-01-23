
exports.up = function (knex) {
  return knex.schema.table('blotter_requests', function (table) {
    table.string('respondent_alias').nullable().after('respondent_name');
    table.text('respondent_address').nullable().after('respondent_alias');
    table.string('respondent_contact').nullable().after('respondent_address');
  });
};

exports.down = function (knex) {
  return knex.schema.table('blotter_requests', function (table) {
    table.dropColumn('respondent_alias');
    table.dropColumn('respondent_address');
    table.dropColumn('respondent_contact');
  });
};
