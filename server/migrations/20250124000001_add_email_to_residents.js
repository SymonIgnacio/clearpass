exports.up = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    table.string('Email', 255).after('Income_Estimate');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('residents', function(table) {
    table.dropColumn('Email');
  });
};