'use strict';

exports.up = async function (knex) {
  const has = await knex.schema.hasTable('audit_log');
  if (!has) return;
  await knex.schema.dropTable('audit_log');
};

exports.down = async function () {
  return;
};

