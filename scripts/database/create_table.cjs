const mysql = require('mysql2/promise');

async function createTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'barangay_management'
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS document_templates (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      template_name VARCHAR(100) NOT NULL UNIQUE,
      document_type VARCHAR(50) NOT NULL,
      template_content TEXT NOT NULL,
      file_path VARCHAR(255),
      original_filename VARCHAR(255),
      file_type VARCHAR(100),
      file_size INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT UNSIGNED,
      updated_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_document_type_active (document_type, is_active),
      INDEX idx_template_name (template_name)
    )
  `);

  console.log('document_templates table created or already exists');

  // Insert default templates
  await connection.execute(`
    INSERT IGNORE INTO document_templates (template_name, document_type, template_content, is_active, created_by) VALUES
    ('Default Barangay Clearance', 'barangay_clearance', '{"title":"BARANGAY CLEARANCE","header_text":"TO WHOM IT MAY CONCERN:","main_content":"This is to certify that the person whose name, signature, thumb marks and other personal data appearing hereon, has requested for a Barangay Clearance from this Office and the results are listed below.","footer_text":"This is to further certify that {resident_name} is a bona fide resident of this Barangay. {resident_name} is known to me with a good moral character, law abiding citizen in the community. {resident_name} has no criminal record found in our Barangay Records.","signature_text":"Given this {issued_date}","validity_text":"Valid until: {valid_until}","location":"Barangay Batia, Bocaue, Bulacan","show_qr_code":true,"show_control_number":true,"font_family":"Times-Roman","font_size":12}', true, 1),
    ('Default Indigency Certificate', 'indigency_certificate', '{"title":"CERTIFICATE OF INDIGENCY","header_text":"TO WHOM IT MAY CONCERN,","main_content":"This is to certify that {resident_name}, {age} years old, with address at {address}, is belonging to the Indigent Family in our Barangay.","additional_content":"As per records of this office, subject person has NO DEROGATORY RECORDS.","footer_text":"This certification is issued upon the request of the above person to be used for his/her {purpose}, {specific_purpose}.","signature_text":"Given this {issued_date} at Batia, Municipality of Bocaue, Bulacan.","validity_text":"Valid until: {valid_until}","location":"Batia, Municipality of Bocaue, Bulacan","show_qr_code":false,"show_control_number":true,"font_family":"Times-Roman","font_size":12}', true, 1)
  `);

  console.log('Default templates inserted');

  await connection.end();
}

createTable().catch(console.error);
