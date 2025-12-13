const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

async function createTable() {
  try {
    console.log('Creating document_templates table...');

    await knex.schema.createTable('document_templates', function(table) {
      table.increments('id').primary();
      table.string('template_name', 100).notNullable().unique();
      table.string('document_type', 50).notNullable();
      table.text('template_content').notNullable();
      table.string('file_path', 255).nullable(); // Path to uploaded file
      table.string('original_filename', 255).nullable(); // Original uploaded filename
      table.string('file_type', 50).nullable(); // MIME type
      table.integer('file_size').nullable(); // File size in bytes
      table.boolean('is_active').defaultTo(true);
      table.integer('created_by').nullable(); // Remove foreign key for now
      table.integer('updated_by').nullable(); // Remove foreign key for now
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['document_type', 'is_active']);
      table.index('template_name');
    });

    console.log('✅ Table created successfully');

    console.log('Inserting default templates...');

    await knex('document_templates').insert([
      {
        template_name: 'Default Barangay Clearance',
        document_type: 'barangay_clearance',
        template_content: JSON.stringify({
          title: 'BARANGAY CLEARANCE',
          header_text: 'TO WHOM IT MAY CONCERN:',
          main_content: 'This is to certify that the person whose name, signature, thumb marks and other personal data appearing hereon, has requested for a Barangay Clearance from this Office and the results are listed below.',
          footer_text: 'This is to further certify that {resident_name} is a bona fide resident of this Barangay. {resident_name} is known to me with a good moral character, law abiding citizen in the community. {resident_name} has no criminal record found in our Barangay Records.',
          signature_text: 'Given this {issued_date}',
          validity_text: 'Valid until: {valid_until}',
          location: 'Barangay Batia, Bocaue, Bulacan',
          show_qr_code: true,
          show_control_number: true,
          font_family: 'Times-Roman',
          font_size: 12
        }),
        is_active: true,
        created_by: 1
      },
      {
        template_name: 'Default Indigency Certificate',
        document_type: 'indigency_certificate',
        template_content: JSON.stringify({
          title: 'CERTIFICATE OF INDIGENCY',
          header_text: 'TO WHOM IT MAY CONCERN,',
          main_content: 'This is to certify that {resident_name}, {age} years old, with address at {address}, is belonging to the Indigent Family in our Barangay.',
          additional_content: 'As per records of this office, subject person has NO DEROGATORY RECORDS.',
          footer_text: 'This certification is issued upon the request of the above person to be used for his/her {purpose}, {specific_purpose}.',
          signature_text: 'Given this {issued_date} at Batia, Municipality of Bocaue, Bulacan.',
          validity_text: 'Valid until: {valid_until}',
          location: 'Batia, Municipality of Bocaue, Bulacan',
          show_qr_code: false,
          show_control_number: true,
          font_family: 'Times-Roman',
          font_size: 12
        }),
        is_active: true,
        created_by: 1
      },
      {
        template_name: 'Default Bonafide Certificate',
        document_type: 'bonafide_certificate',
        template_content: JSON.stringify({
          title: 'BONAFIDE CERTIFICATE',
          header_text: 'TO WHOM IT MAY CONCERN:',
          main_content: 'This is to certify that {resident_name}, {age} years old, is a bona fide resident of {address}.',
          additional_content: 'This further certifies that the above-named person has been residing in this barangay for {years_of_residency}.',
          footer_text: 'This certification is issued upon the request of the above-named person for {purpose}.',
          signature_text: 'Given this {issued_date}',
          validity_text: 'Valid until: {valid_until}',
          location: 'Barangay Batia, Bocaue, Bulacan',
          show_qr_code: false,
          show_control_number: true,
          font_family: 'Times-Roman',
          font_size: 12
        }),
        is_active: true,
        created_by: 1
      }
    ]);

    console.log('✅ Default templates inserted successfully');

    await knex.destroy();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists, skipping creation');
    } else {
      process.exit(1);
    }
  }
}

createTable();
