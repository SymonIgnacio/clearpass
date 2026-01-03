import knex from 'knex';
import knexConfig from '../../../server/knexfile.js';

const db = knex(knexConfig.development);

async function runClearPassMigration() {
  try {
    console.log('🔒 Running THEMIS CLEARPASS migration...');

    // Update users table
    console.log('📋 Updating users table for THEMIS CLEARPASS...');

    // Check if columns exist first
    const hasResidentId = await db.schema.hasColumn('users', 'resident_id');
    const hasPinCode = await db.schema.hasColumn('users', 'pin_code');

    await db.schema.alterTable('users', function(table) {
      // Update role column to use THEMIS CLEARPASS hierarchy (1-6)
      table.tinyint('role').notNullable().defaultTo(4).comment('THEMIS CLEARPASS Role ID: 1=IT Admin, 2=Clerk, 3=Blotter Officer, 4=Resident, 5=Captain, 6=Secretary').alter();

      // Ensure resident_id column exists (for linking users to resident profiles)
      if (!hasResidentId) {
        table.string('resident_id', 50).nullable().comment('Links user to resident profile for ClearPass validation');
      }

      // Ensure pin_code column exists (for Role 4 Resident login)
      if (!hasPinCode) {
        table.string('pin_code', 6).nullable().comment('6-digit PIN for ResidentID + PIN authentication');
      }
    });

    console.log('✅ Users table updated');

    // Update existing roles from old system (0-5) to new THEMIS hierarchy (1-6)
    await db('users').update({
      role: db.raw(`
        CASE
          WHEN role = 0 THEN 1  -- IT Admin (was 0, now 1)
          WHEN role = 1 THEN 5  -- Captain (was 1, now 5)
          WHEN role = 2 THEN 6  -- Secretary (was 2, now 6)
          WHEN role = 3 THEN 2  -- Clerk (was 3, now 2)
          WHEN role = 4 THEN 3  -- Blotter Officer (was 4, now 3)
          WHEN role = 5 THEN 4  -- Resident (was 5, now 4)
          ELSE 4                -- Default to Resident
        END
      `)
    });

    console.log('✅ User roles migrated to THEMIS CLEARPASS hierarchy');

    // Update blotter table for ClearPass validation
    console.log('📋 Updating blotter table for ClearPass validation...');

    const hasRespondentId = await db.schema.hasColumn('blotter', 'respondent_id');
    const hasHearingCount = await db.schema.hasColumn('blotter', 'hearing_count');
    const hasMissedHearings = await db.schema.hasColumn('blotter', 'missed_hearings');

    if (!hasHearingCount || !hasMissedHearings) {
      await db.schema.alterTable('blotter', function(table) {
        // Ensure hearing_count and missed_hearings for ClearPass logic
        if (!hasHearingCount) {
          table.integer('hearing_count').defaultTo(0).comment('Number of hearings scheduled');
        }
        if (!hasMissedHearings) {
          table.integer('missed_hearings').defaultTo(0).comment('Number of missed hearings (ClearPass blocks at 3+)');
        }
      });
    }

    // Add respondent_id if it doesn't exist (without foreign key constraint to avoid issues)
    if (!hasRespondentId) {
      await db.schema.alterTable('blotter', function(table) {
        table.string('respondent_id', 50).nullable().comment('Resident ID for ClearPass validation');
      });
    }

    console.log('✅ Blotter table updated for ClearPass validation');

    // Create clearance_requests table for structured clearance workflow
    console.log('📋 Creating clearance_requests table...');

    const hasClearanceRequestsTable = await db.schema.hasTable('clearance_requests');
    if (!hasClearanceRequestsTable) {
      await db.schema.createTable('clearance_requests', function(table) {
        table.increments('id').primary();
        table.string('request_id', 50).unique().notNullable();
        table.string('resident_id', 50).notNullable().comment('Resident requesting clearance');
        table.string('purpose', 500).notNullable();
        table.enu('status', ['pending', 'approved', 'rejected', 'issued']).defaultTo('pending');
        table.integer('requested_by').nullable().comment('User ID who requested');
        table.integer('approved_by').nullable().comment('User ID who approved');
        table.integer('issued_by').nullable().comment('Clerk ID who issued');
        table.timestamp('requested_at').defaultTo(db.fn.now());
        table.timestamp('approved_at').nullable();
        table.timestamp('issued_at').nullable();
        table.text('notes').nullable();
        table.timestamps(true, true);

        // Indexes
        table.index(['resident_id', 'status']);
        table.index(['requested_by', 'status']);
        table.index('request_id');
      });

      console.log('✅ Clearance requests table created');
    } else {
      console.log('⚠️ Clearance requests table already exists');
    }

    console.log('🎯 THEMIS CLEARPASS migration completed successfully!');
    console.log('🔒 ClearPass protocol is now active');
    console.log('📊 Database schema updated for 6-tier RBAC');

  } catch (error) {
    console.error('❌ THEMIS CLEARPASS migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

runClearPassMigration();
