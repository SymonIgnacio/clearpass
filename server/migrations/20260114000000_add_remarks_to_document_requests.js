
exports.up = function(knex) {
  return knex.schema.table('document_requests', function(table) {
    table.text('remarks').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('document_requests', function(table) {
    table.dropColumn('remarks');
  });
};
