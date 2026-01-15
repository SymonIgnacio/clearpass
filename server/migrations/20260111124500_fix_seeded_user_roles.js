'use strict';

exports.up = async function (knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  const usernameToRole = [
    { username: 'superadmin', role: 1 },
    { username: 'captain', role: 2 },
    { username: 'secretary', role: 3 },
    { username: 'clerk', role: 4 },
    { username: 'officer', role: 6 },
    { username: 'resident', role: 12 }
  ];

  for (const entry of usernameToRole) {
    await knex('users').where({ username: entry.username }).update({ role: entry.role });
  }
};

exports.down = async function () {
  return;
};

