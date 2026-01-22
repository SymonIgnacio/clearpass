exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('mfa_otp_challenges');
  if (exists) return;

  await knex.schema.createTable('mfa_otp_challenges', table => {
    table.increments('id').primary();
    table.string('user_id', 50).notNullable();
    table.string('otp_hash', 255).notNullable();
    table.integer('attempts_remaining').unsigned().notNullable().defaultTo(5);
    table.timestamp('expires_at').notNullable();
    table.timestamp('consumed_at').nullable().defaultTo(null);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id', 'created_at']);
  });
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('mfa_otp_challenges');
  if (!exists) return;
  await knex.schema.dropTable('mfa_otp_challenges');
};
