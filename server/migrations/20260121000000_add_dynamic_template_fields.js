/**
 * Migration to add dynamic configuration columns to document_templates
 */
exports.up = function(knex) {
  return knex.schema.table('document_templates', function(table) {
    table.json('required_fields').nullable().comment('JSON configuration for user inputs');
    table.string('display_name', 255).nullable().comment('Human-readable name for the certificate');
    table.boolean('is_custom').defaultTo(false).comment('Flag for user-created templates');
  });
};

exports.down = function(knex) {
  return knex.schema.table('document_templates', function(table) {
    table.dropColumn('required_fields');
    table.dropColumn('display_name');
    table.dropColumn('is_custom');
  });
};
