const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const PizZip = require('pizzip');
const knex = require('../server/knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);

const TEMPLATE_DIR = path.join(__dirname, '../../Certificate Templates');

// Map filenames (lowercase partials) to document types
const TYPE_MAPPING = {
  clearance: 'barangay_clearance',
  bonafide: 'bonafide_certificate',
  building: 'building_permit',
  'closed biz': 'business_closure',
  cohabitation: 'cohabitation_certificate',
  excavation: 'excavation_permit',
  fencing: 'fencing_permit',
  'good moral': 'good_moral_certificate',
  indigency: 'indigency_certificate',
  'late registration': 'late_registration',
  ojt: 'ojt_certification',
  housing: 'low_income_housing',
  medico: 'medico_legal',
};

async function checkDocxPlaceholders(buffer) {
  try {
    const zip = new PizZip(buffer);
    const text = zip.files['word/document.xml'].asText();
    // Simple regex to find {tags}
    const matches = text.match(/\{[^}]+\}/g) || [];
    return matches;
  } catch (e) {
    return null;
  }
}

async function checkPdfFields(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map(f => f.getName());
    return fields;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('Starting template import analysis...');

  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(`Directory not found: ${TEMPLATE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEMPLATE_DIR);
  const results = [];

  for (const file of files) {
    const filePath = path.join(TEMPLATE_DIR, file);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) continue;

    const ext = path.extname(file).toLowerCase();
    const nameLower = path.basename(file, ext).toLowerCase();

    // Determine document type
    let docType = null;
    for (const [key, type] of Object.entries(TYPE_MAPPING)) {
      if (nameLower.includes(key)) {
        docType = type;
        break;
      }
    }

    const fileBuffer = fs.readFileSync(filePath);
    let status = 'SKIPPED';
    let details = '';
    let placeholders = [];

    if (ext === '.doc') {
      status = 'INVALID_FORMAT';
      details = 'Old Word format (.doc) not supported. Convert to .docx';
    } else if (ext === '.docx') {
      const tags = await checkDocxPlaceholders(fileBuffer);
      if (tags && tags.length > 0) {
        status = 'READY';
        placeholders = tags;
        details = `Found ${tags.length} placeholders: ${tags.slice(0, 3).join(', ')}...`;
      } else {
        status = 'WARNING';
        details = 'No {placeholders} found. Document will be static.';
      }
    } else if (ext === '.pdf') {
      const fields = await checkPdfFields(fileBuffer);
      if (fields && fields.length > 0) {
        status = 'READY';
        placeholders = fields;
        details = `Found ${fields.length} form fields: ${fields.slice(0, 3).join(', ')}...`;
      } else {
        status = 'WARNING';
        details = 'No AcroForm fields found. PDF will be static.';
      }
    } else {
      status = 'IGNORED';
      details = 'Unsupported file type';
    }

    results.push({
      file,
      docType,
      status,
      details,
      placeholders,
    });

    // Import to DB if recognized type and supported format
    if (docType && (ext === '.docx' || ext === '.pdf')) {
      try {
        // Check if exists
        const existing = await db('document_templates').where('document_type', docType).first();

        const templateData = {
          template_name: `Imported: ${file}`,
          document_type: docType,
          template_content: JSON.stringify({ imported: true, original_file: file }),
          file_data: fileBuffer,
          file_encoding:
            ext === '.pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          original_filename: file,
          file_type: ext.substring(1),
          file_size: stats.size,
          is_active: true,
          updated_at: new Date(),
        };

        if (existing) {
          // Update existing
          await db('document_templates').where('id', existing.id).update(templateData);
          console.log(`UPDATED: ${docType} from ${file}`);
        } else {
          // Insert new
          await db('document_templates').insert(templateData);
          console.log(`INSERTED: ${docType} from ${file}`);
        }
      } catch (err) {
        console.error(`Failed to import ${file}:`, err.message);
      }
    }
  }

  console.log('\n--- ANALYSIS REPORT ---');
  console.table(
    results.map(r => ({
      File: r.file,
      Type: r.docType || 'UNKNOWN',
      Status: r.status,
      Details: r.details,
    }))
  );

  await db.destroy();
}

main();
