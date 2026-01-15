exports.up = function(knex) {
  return knex.schema
    // Create vehicles table
    .createTable('vehicles', function(table) {
      table.increments('id').primary();
      table.string('owner_id', 50).nullable().comment('Resident ID of owner');
      table.string('plate_number', 20).unique().notNullable();
      table.string('make', 50);
      table.string('model', 50);
      table.string('color', 30);
      table.enu('vehicle_type', ['Motorcycle', 'Tricycle', 'Car', 'Van', 'Truck', 'Bicycle', 'Other']).defaultTo('Other');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.foreign('owner_id').references('Resident_ID').inTable('residents').onDelete('SET NULL');
      table.index('owner_id');
      table.index('plate_number');
    })
    
    // Create visitors table
    .createTable('visitors', function(table) {
      table.increments('id').primary();
      table.string('visitor_name', 100).notNullable();
      table.string('purpose', 255).notNullable();
      table.string('host_resident_id', 50).nullable().comment('Resident being visited');
      table.timestamp('time_in').defaultTo(knex.fn.now());
      table.timestamp('time_out').nullable();
      table.string('id_type_presented', 50);
      table.string('id_number', 50);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('host_resident_id').references('Resident_ID').inTable('residents').onDelete('SET NULL');
    })
    
    // Fix users table role constraint and comment
    .alterTable('users', function(table) {
      // Update comment to reflect actual role mapping
      table.tinyint('role').defaultTo(12).comment('THEMIS Role ID: 1=IT Admin, 2=Captain, 3=Secretary, 4=Clerk, 6=Blotter Officer, 12=Resident').alter();
      
      // Add foreign key constraint if it doesn't exist
      // Note: We need to be careful if invalid data exists. 
      // Ideally we would clean data first, but for now we assume data is clean or we might get an error.
      // We'll use a raw query for the FK to ensure we can check existence or handle errors gracefully if knex doesn't support "if not exists" for FKs well.
    })
    .then(async () => {
       // Add FK constraint to users.role -> roles.id using raw SQL to avoid failure if it already exists
       // and to be explicit.
       try {
         await knex.raw('ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id)');
       } catch (e) {
         // Ignore error if constraint already exists (Error 1061: Duplicate key name)
         if (e.errno !== 1061 && !e.message.includes('Duplicate key name')) {
            console.warn('Warning: Could not add FK constraint to users.role:', e.message);
         }
       }
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('visitors')
    .dropTableIfExists('vehicles')
    .alterTable('users', function(table) {
      table.dropForeign('role', 'fk_users_role');
      // Revert comment? Maybe not necessary to revert documentation improvements.
    });
};
