
exports.up = function(knex) {
  return knex.schema.hasColumn('residents', 'Age').then(exists => {
    if (!exists) {
      return knex.schema.alterTable('residents', function(table) {
        table.integer('Age').defaultTo(0).comment('Calculated age from Birthdate');
        table.index('Age');
      });
    }
  }).then(() => {
    // Populate Age
    return knex.raw(`
      UPDATE residents 
      SET Age = TIMESTAMPDIFF(YEAR, Birthdate, CURDATE())
      WHERE Birthdate IS NOT NULL
    `);
  });
};

exports.down = function(knex) {
  // We can drop the column if we want to revert fully, 
  // but if it was supposed to be there, maybe just leave it.
  // For strict rollback:
  return knex.schema.alterTable('residents', function(table) {
    table.dropColumn('Age');
  });
};
