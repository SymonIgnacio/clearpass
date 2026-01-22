exports.up = function (knex) {
  return knex.schema
    .dropTableIfExists('resident_verification_requests')
    .then(() => {
      return knex.schema.createTable('resident_verification_requests', function (table) {
        table.increments('id').primary();
        table.string('request_id', 100).unique().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.string('proof_of_residency_path', 255).nullable(); // Keep for backward compatibility
        table.binary('file_data').nullable().comment('Binary file data stored in database');
        table.string('file_encoding', 50).nullable().comment('File encoding type (e.g., buffer)');
        table.string('original_filename', 255).nullable().comment('Original uploaded filename');
        table.string('mime_type', 100).nullable().comment('File MIME type (e.g., image/jpeg)');
        table.integer('file_size').nullable().comment('File size in bytes');
        table.string('proof_type', 100).nullable();
        table.text('notes').nullable();
        table.enum('status', ['draft', 'pending', 'approved', 'rejected']).defaultTo('draft');
        table.timestamp('submitted_at').nullable();
        table.timestamp('reviewed_at').nullable();
        table.integer('reviewed_by').unsigned().nullable();
        table.text('review_notes').nullable();
        table.timestamps(true, true);

        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.foreign('reviewed_by').references('users.id').onDelete('SET NULL');
        table.index(['user_id', 'status'], 'idx_user_status');
        table.index('status', 'idx_status');
        table.index('request_id', 'idx_request_id');
      });
    })
    .then(() => {
      console.log('✅ Created resident_verification_requests table with BLOB support');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('resident_verification_requests').then(() => {
    console.log('✅ Dropped resident_verification_requests table');
  });
};
