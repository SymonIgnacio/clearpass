'use strict';

exports.up = async function (knex) {
  const hasUsers = await knex.schema.hasTable('users');
  const hasRoles = await knex.schema.hasTable('roles');
  if (!hasUsers || !hasRoles) return;

  await knex.raw('UPDATE users SET role = 12 WHERE role IS NULL');

  try {
    await knex.raw('ALTER TABLE roles ADD PRIMARY KEY (id)');
  } catch {}

  try {
    await knex.raw('ALTER TABLE users MODIFY role INT(11) NOT NULL DEFAULT 12');
  } catch {}

  try {
    await knex.raw('CREATE INDEX idx_users_role ON users(role)');
  } catch {}

  try {
    await knex.raw(
      'ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id) ON UPDATE RESTRICT ON DELETE RESTRICT'
    );
  } catch {}
};

exports.down = async function (knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  try {
    await knex.raw('ALTER TABLE users DROP FOREIGN KEY fk_users_role');
  } catch {}

  try {
    await knex.raw('DROP INDEX idx_users_role ON users');
  } catch {}
};

