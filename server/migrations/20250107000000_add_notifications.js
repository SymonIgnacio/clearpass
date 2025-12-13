exports.up = function(knex) {
  return knex.schema
    .createTable('notifications', function(table) {
      table.increments('id').primary();
      table.string('type', 50).notNullable().defaultTo('info'); // success, error, warning, info, event, sms, announcement
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.string('priority', 20).notNullable().defaultTo('normal'); // low, normal, medium, high
      table.json('data').nullable(); // Additional notification data
      table.boolean('is_system').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['type', 'priority']);
      table.index('created_at');
    })
    .createTable('user_notifications', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('notification_id').unsigned().notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('read_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('notification_id').references('id').inTable('notifications').onDelete('CASCADE');

      table.unique(['user_id', 'notification_id']);
      table.index(['user_id', 'is_read']);
      table.index('created_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_notifications')
    .dropTableIfExists('notifications');
};
