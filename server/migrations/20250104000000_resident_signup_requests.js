'use strict';

exports.up = function (knex) {
  // THEMIS: Eliminate public registration - drop resident_signup_requests table
  return knex.schema.dropTableIfExists('resident_signup_requests');
};

exports.down = function (knex) {
  return knex.schema.dropTable('resident_signup_requests');
};
