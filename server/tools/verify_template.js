const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Path to template
const TEMPLATE_PATH = path.join(__dirname, '../../Certificate Templates/1 bgy clearance.docx');
const OUTPUT_PATH = path.join(__dirname, '../../1_bgy_clearance_TEST_OUTPUT.docx');

// Mock Data
const data = {
  resident_name: 'JUAN DELA CRUZ',
  address: 'Block 1 Lot 2, Sitio 3, Brgy. Batia, Bocaue, Bulacan',
  date_of_birth: '1990-01-01',
  place_of_birth: 'Bocaue, Bulacan',
  purpose: 'EMPLOYMENT',
  valid_until: '2026-01-20',
  issued_on: '2025-01-20',
  ctc_no: 'CTC-12345',
  or_no: 'OR-67890',
  prepared_by: 'MARIA SANTOS',
  issued_at: 'Barangay Batia, Bocaue, Bulacan',

  // Extra fields just in case
  age: '35',
  civil_status: 'Single',
  captain_name: 'HON. KAPITAN',
};

console.log('Testing Template Generation...');
console.log('Template:', TEMPLATE_PATH);
console.log('Output:', OUTPUT_PATH);

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('ERROR: Template file not found!');
  process.exit(1);
}

try {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Render the document
  doc.render(data);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  fs.writeFileSync(OUTPUT_PATH, buf);
  console.log('SUCCESS: Generated 1_bgy_clearance_TEST_OUTPUT.docx');
} catch (error) {
  console.error('ERROR during generation:', error);
  if (error.properties && error.properties.errors) {
    error.properties.errors.forEach(e => {
      console.error(' -', e.message);
    });
  }
}
