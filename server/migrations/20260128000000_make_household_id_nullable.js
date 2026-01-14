exports.up = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    table.string('Household_ID', 50).nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    // Note: This might fail if there are existing null values when rolling back
    table.string('Household_ID', 50).notNullable().alter();
  });
};
