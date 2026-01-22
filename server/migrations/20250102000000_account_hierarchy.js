exports.up = function (knex) {
  return (
    knex.schema
      // ==========================================
      // ACCOUNT HIERARCHY SYSTEM
      // ==========================================

      // Create roles table
      .createTable('roles', function (table) {
        table.increments('id').primary();
        table.string('role_name', 100).notNullable().unique();
        table.text('description');
        table.integer('hierarchy_level').notNullable().defaultTo(0); // Higher number = higher authority
        table.json('permissions').nullable(); // JSON array of permissions
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('role_name');
        table.index('hierarchy_level');
      })

      // Modify users table to add hierarchy
      .alterTable('users', function (table) {
        table.integer('parent_user_id').nullable().unsigned();
        table.integer('role_id').nullable().unsigned();
        table.foreign('parent_user_id').references('id').inTable('users');
        table.foreign('role_id').references('id').inTable('roles');
        table.index('parent_user_id');
        table.index('role_id');
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table.dropForeign('parent_user_id');
      table.dropForeign('role_id');
      table.dropIndex('parent_user_id');
      table.dropIndex('role_id');
      table.dropColumn('parent_user_id');
      table.dropColumn('role_id');
    })
    .dropTableIfExists('roles');
};
