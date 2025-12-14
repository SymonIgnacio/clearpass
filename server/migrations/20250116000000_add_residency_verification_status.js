exports.up = function (knex) {
  return knex.schema
    .alterTable('users', function (table) {
      // Add residency verification status for Firebase users
      // This tracks whether users have verified their barangay residency
      table.enum('residency_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
      table.timestamp('residency_verified_at').nullable();
      table.string('residency_verified_by', 50).nullable(); // Staff user ID who verified
      table.index('residency_status');
    })
    .then(() => {
      // Create resident_verification_requests table
      // This is for post-signup residency verification process
      return knex.schema.createTable('resident_verification_requests', function (table) {
        table.increments('id').primary();
        table.string('request_id').unique().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.string('proof_of_residency_path').nullable();
        table.enum('proof_type', [
          'electric_bill',
          'water_bill',
          'cedula',
          'barangay_id',
          'property_tax',
          'other'
        ]).nullable();
        table.enum('status', ['draft', 'pending', 'approved', 'rejected']).defaultTo('draft');
        table.timestamp('submitted_at').nullable();
        table.timestamp('reviewed_at').nullable();
        table.integer('reviewed_by').unsigned().nullable(); // Staff user ID
        table.text('review_notes').nullable();
        table.timestamps(true, true);

        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.foreign('reviewed_by').references('users.id').onDelete('SET NULL');
        table.index(['user_id', 'status']);
        table.index('status');
        table.index('request_id');
      });
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('resident_verification_requests')
    .then(() => {
      return knex.schema.alterTable('users', function (table) {
        table.dropIndex('residency_status');
        table.dropColumn('residency_verified_at');
        table.dropColumn('residency_verified_by');
        table.dropColumn('residency_status');
      });
    });
};
