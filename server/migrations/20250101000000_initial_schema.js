exports.up = function (knex) {
  return (
    knex.schema
      // ==========================================
      // 1. CORE ENTITIES - SCHEMA
      // ==========================================

      // Table: Sitios (Hardcoded as per requirements)
      .createTable('sitios', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.text('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('name');
      })

      // Table: Households (RBIM - Registry of Barangay Inhabitants and Migrants)
      .createTable('households', function (table) {
        table.string('Household_ID', 50).primary(); // Manual ID from Census (e.g., H-2025-001)
        table.string('Household_Number', 20).notNullable().unique(); // Census Household Number
        table.integer('Sitio_ID').notNullable().unsigned();
        table.text('Street_Address').notNullable();
        table.specificType('Coordinates', 'POINT').nullable(); // Lat/Long for Heatmaps (optional)
        table.string('Head_Resident_ID', 50).nullable(); // Links to main head of household (UUID) - FK added later
        table.integer('Total_Members').defaultTo(1);
        table
          .enu('Household_Type', ['Nuclear', 'Extended', 'Single', 'Boarding'])
          .defaultTo('Nuclear');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.foreign('Sitio_ID').references('id').inTable('sitios');
        table.index('Sitio_ID');
        table.index('Head_Resident_ID');
      })

      // Table: Residents (Enhanced RBIM Profile)
      .createTable('residents', function (table) {
        table.string('Resident_ID', 50).primary(); // UUID format
        table.string('Household_ID', 50).notNullable();
        table
          .enu('Relation_to_Head', ['Head', 'Spouse', 'Child', 'Relative', 'Boarder'])
          .defaultTo('Head');
        table.string('First_Name', 100).notNullable();
        table.string('Middle_Name', 100);
        table.string('Last_Name', 100).notNullable();
        table.string('Suffix', 10);
        table.date('Birthdate').notNullable();
        table.integer('Age').defaultTo(0); // Calculated in application layer
        table.enu('Gender', ['Male', 'Female', 'Other']).notNullable();
        table
          .enu('Civil_Status', ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])
          .defaultTo('Single');
        table.string('Occupation', 100);
        table.decimal('Income_Estimate', 10, 2);
        table.string('Mobile_Number', 20); // Critical for SMS OTP
        table.enu('Voter_Status', ['Registered', 'Non-Registered']).defaultTo('Non-Registered');
        table.date('Date_Arrival').nullable(); // When they moved in
        table
          .enu('Residency_Status', ['Active', 'Deceased', 'Transferred Out', 'Transient'])
          .defaultTo('Active');
        table.text('Departure_Reason');
        table.date('Departure_Date');
        table.string('Profile_Photo_URL', 255);
        table.string('QR_Hash_String', 255).unique(); // Unique identity token
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.foreign('Household_ID').references('Household_ID').inTable('households');
        table.index('Household_ID');
        table.index(['Last_Name', 'First_Name']);
        table.index('Age');
        table.index('Mobile_Number');
        table.index('Residency_Status');
        table.index('QR_Hash_String');
      })

      // Add foreign key constraint after both tables exist
      .alterTable('households', function (table) {
        table.foreign('Head_Resident_ID').references('Resident_ID').inTable('residents');
      })

      // Table: Vulnerabilities (One-to-One with Residents - RBIM Compliance)
      .createTable('vulnerabilities', function (table) {
        table.string('Resident_ID', 50).primary();
        table.boolean('Is_4Ps').defaultTo(false);
        table.boolean('Is_PWD').defaultTo(false);
        table.boolean('Is_Senior').defaultTo(false); // Calculated in application layer
        table.boolean('Is_Solo_Parent').defaultTo(false);
        table.boolean('Is_Out_of_School_Youth').defaultTo(false);
        table.string('Disability_Type', 100).nullable(); // For PWD classification
        table.integer('Vulnerability_Score').defaultTo(0); // Calculated in application layer
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table
          .foreign('Resident_ID')
          .references('Resident_ID')
          .inTable('residents')
          .onDelete('CASCADE');
        table.index('Vulnerability_Score');
      })

      // ==========================================
      // 2. BLOTTER & INCIDENT MANAGEMENT - SCHEMA
      // ==========================================

      // Table: Blotter (Incident Reporting - Katarungang Pambarangay compliant)
      .createTable('blotter', function (table) {
        table.string('Case_Number', 50).primary(); // Format: BLOT-YYYY-MM-0001
        table.json('Complainant_Details').notNullable(); // { Name, Address, Contact, ID_Proof }
        table.json('Respondent_Details'); // { Name, Address, Alias, Contact }
        table
          .enu('Incident_Type', [
            // Offenses Against Persons (High Priority)
            'Physical Injury',
            'Unjust Vexation',
            'Grave Threats',
            'Alarming and Scandal',
            // Offenses Against Property (Medium Priority)
            'Theft (Petty)',
            'Malicious Mischief',
            'Estafa (Swindling)',
            'Trespassing',
            // Civil & Family Disputes (Low Priority - Mediation Only)
            'Collection of Sum of Money',
            'Ejectment',
            'Boundary Dispute',
            'Family Dispute',
            // Community & Ordinance (High Priority for Patrols)
            'Curfew Violation',
            'Noise Barrage',
            'Illegal Parking',
            'Waste Management',
            'Stray Animals',
          ])
          .notNullable();
        table.text('Narrative').notNullable(); // The "Sumbong"
        table.datetime('DateTime_Incident').notNullable();
        table
          .enu('Location_Sitio', ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'])
          .notNullable();
        table
          .enu('Status', [
            'Pending',
            'Scheduled for Mediation',
            'Amicably Settled',
            'Certificate to File Action Issued',
            'Dismissed',
            'Ongoing',
          ])
          .defaultTo('Pending');
        table.datetime('Hearing_Schedule').nullable(); // For Summons
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('Status');
        table.index('DateTime_Incident');
        table.index('Location_Sitio');
        table.index('Incident_Type');
      })

      // ==========================================
      // 3. CERTIFICATE ISSUANCE SYSTEM - SCHEMA
      // ==========================================

      // Table: Certificate_Types (Dynamic certificate types)
      .createTable('certificate_types', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.decimal('fee', 8, 2).defaultTo(0.0);
        table.integer('validity_days').defaultTo(365);
        table.text('description');
        table.text('purpose');
        table.text('when_needed');
        table.text('required_data'); // JSON array of required fields
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })

      // Table: Certificates_Log (Document Issuance with QR)
      .createTable('certificates_log', function (table) {
        table.string('control_no', 50).primary(); // Auto-generated
        table.string('resident_id', 50).notNullable(); // References Resident_ID from residents table
        table.string('certificate_type', 100).notNullable();
        table.text('purpose');
        table.date('date_issued').notNullable();
        table.string('signatory_captain', 255); // Digital signature URL
        table.string('signatory_secretary', 255); // Digital signature URL
        table.string('qr_validation_string', 255).unique(); // QR code for validation
        table.enu('status', ['Paid', 'Released', 'Cancelled']).defaultTo('Paid');
        table.decimal('fee_amount', 8, 2).defaultTo(0.0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('resident_id').references('Resident_ID').inTable('residents');
        table.index('resident_id');
        table.index('certificate_type');
        table.index('qr_validation_string');
        table.index('date_issued');
      })

      // ==========================================
      // 4. STAFF MANAGEMENT - SCHEMA
      // ==========================================

      // Table: Officials (Staff Management per Survey)
      .createTable('officials', function (table) {
        table.increments('id').primary();
        table.string('name', 200).notNullable();
        table.enu('position', ['Captain', 'Secretary', 'Clerk']).notNullable();
        table.string('digital_signature_url', 255);
        table.enu('role_access_level', ['Full', 'Limited', 'Basic']).defaultTo('Basic');
        table.string('contact_number', 20);
        table.string('email', 100);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('position');
        table.index('is_active');
      })

      // ==========================================
      // 5. SYSTEM MANAGEMENT - SCHEMA
      // ==========================================

      // Table: Users (Authentication System)
      .createTable('users', function (table) {
        table.increments('id').primary();
        table.string('username', 50).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table
          .enu('role', ['admin', 'captain', 'secretary', 'clerk', 'tanod', 'resident'])
          .notNullable();
        table.string('email', 100);
        table.string('full_name', 200);
        table.string('contact_number', 20);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('last_login').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('role');
        table.index('is_active');
      })

      // ==========================================
      // 6. AUDIT & LOGGING SYSTEM - SCHEMA
      // ==========================================

      // Table: Audit_Log (Complete audit trail)
      .createTable('audit_log', function (table) {
        table.increments('id').primary();
        table.integer('user_id').nullable().unsigned();
        table.string('action', 100).notNullable(); // e.g., "Certificate Issued", "Blotter Created"
        table.string('entity_type', 50).notNullable(); // e.g., "certificate", "blotter", "resident"
        table.string('entity_id', 50); // ID of the affected entity
        table.text('details'); // Additional action details (JSON string for compatibility)
        table.string('ip_address', 45);
        table.text('user_agent');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('user_id').references('id').inTable('users');
        table.index('user_id');
        table.index(['entity_type', 'entity_id']);
        table.index('created_at');
      })

      // ==========================================
      // 7. ADDITIONAL FEATURES - SCHEMA
      // ==========================================

      // Table: Tanod_Patrol_Schedule
      .createTable('tanod_patrol_schedule', function (table) {
        table.increments('id').primary();
        table.string('patrol_area', 100).notNullable();
        table.integer('sitio_id').nullable().unsigned();
        table.text('assigned_tanods'); // JSON array of tanod IDs/names
        table.time('shift_start').notNullable();
        table.time('shift_end').notNullable();
        table.date('patrol_date').notNullable();
        table
          .enu('status', ['Scheduled', 'Active', 'Completed', 'Cancelled'])
          .defaultTo('Scheduled');
        table.boolean('ai_recommended').defaultTo(false); // Whether AI suggested this patrol
        table.text('notes');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('sitio_id').references('id').inTable('sitios');
        table.index('patrol_date');
        table.index('sitio_id');
        table.index('status');
      })

      // Table: Community_Programs
      .createTable('community_programs', function (table) {
        table.increments('id').primary();
        table.string('program_name', 200).notNullable();
        table.text('description');
        table.date('program_date').notNullable();
        table.integer('sitio_id').nullable().unsigned();
        table.text('target_beneficiaries'); // Who the program targets
        table.enu('status', ['Planned', 'Ongoing', 'Completed', 'Cancelled']).defaultTo('Planned');
        table.string('organizer', 100);
        table.decimal('budget_allocated', 10, 2).defaultTo(0.0);
        table.decimal('actual_cost', 10, 2).defaultTo(0.0);
        table.integer('participants_count').defaultTo(0);
        table.integer('success_rating'); // 1-5 scale
        table.text('notes');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.foreign('sitio_id').references('id').inTable('sitios');
        table.index('program_date');
        table.index('sitio_id');
        table.index('status');
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('audit_log')
    .dropTableIfExists('users')
    .dropTableIfExists('officials')
    .dropTableIfExists('certificates_log')
    .dropTableIfExists('certificate_types')
    .dropTableIfExists('blotter')
    .dropTableIfExists('vulnerabilities')
    .dropTableIfExists('residents')
    .dropTableIfExists('households')
    .dropTableIfExists('sitios')
    .dropTableIfExists('tanod_patrol_schedule')
    .dropTableIfExists('community_programs');
};
