exports.up = function (knex) {
  return knex.schema.table('document_requests', function (table) {
    table.specificType('attachment_front_id', 'LONGBLOB');
    table.specificType('attachment_back_id', 'LONGBLOB');
    table.string('attachment_front_mime', 100);
    table.string('attachment_back_mime', 100);
  });
};

exports.down = function (knex) {
  return knex.schema.table('document_requests', function (table) {
    table.dropColumn('attachment_front_id');
    table.dropColumn('attachment_back_id');
    table.dropColumn('attachment_front_mime');
    table.dropColumn('attachment_back_mime');
  });
};
